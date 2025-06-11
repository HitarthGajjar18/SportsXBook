const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const Facility = require('../models/Facility');
const Booking = require('../models/Booking');


// @route   POST /api/bookings
// @desc    Create a booking
router.post('/', authenticateUser, async (req, res) => {
  try {
    console.log("Incoming booking payload:", req.body);

    const {
      facilityId,
      sportId,
      date,
      timeSlot,
      duration,
      numberOfResources,
      numberOfPeople,
      paymentMode
    } = req.body;

    if (!facilityId || !sportId || !date || !timeSlot || !duration || !numberOfResources || !numberOfPeople || !paymentMode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const sport = facility.sports.find(s => s.sportId.toString() === sportId);
    if (!sport) {
      return res.status(404).json({ message: 'Sport not found in facility' });
    }

    // Check for overlapping bookings and calculate already booked resources
    const bookings = await Booking.find({
      facility: facilityId,
      sportId: sportId,
      date,
      status: { $ne: 'Cancelled' }
    });

    let conflictFound = false;
    let totalBooked = 0;

    const selectedStart = parseInt(timeSlot.split(':')[0]);
    const selectedSlots = new Set();
    for (let i = 0; i < duration; i++) {
      selectedSlots.add(String(selectedStart + i).padStart(2, '0') + ':00');
    }

    bookings.forEach(booking => {
      const start = parseInt(booking.timeSlot.split(':')[0]);
      for (let i = 0; i < booking.duration; i++) {
        const hour = String(start + i).padStart(2, '0') + ':00';
        if (selectedSlots.has(hour)) {
          totalBooked += booking.numberOfResources;
        }
      }
    });

    const available = sport.noOfResources - totalBooked;
    if (available < numberOfResources) {
      return res.status(400).json({ message: `Only ${available} resources available for selected time slot(s)` });
    }

    const totalPrice = sport.price * numberOfResources * duration;

    const newBooking = new Booking({
      user: req.user._id,
      facility: facilityId,
      sportId,
      date,
      timeSlot,
      duration,
      numberOfResources,
      numberOfPeople,
      paymentMode,
      totalPrice,
      status: 'Confirmed'
    });
    

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});






// @route   GET /api/bookings/admin
// @desc    Get all bookings for admin
// @access  Private / Admin only
router.get('/admin', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('facility', 'name address')
      .populate('user', 'fullName email')
      .populate('sportId', 'name');
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching all bookings:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/owner
// @desc    Get all bookings for the owner's facilities
// @access  Private (Owner)
router.get('/owner', authenticateUser, authorizeRoles('owner'), async (req, res) => {
  try {
    const facilities = await Facility.find({ owner: req.user._id }).select('_id');
    const facilityIds = facilities.map(f => f._id);

    const bookings = await Booking.find({
      facility: { $in: facilityIds }
    }).populate('facility', 'name address').populate('sportId', 'name').populate('user', 'fullName email').sort({ createdAt: -1 });;

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching owner bookings:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:bookingId/status
// @desc    Update booking status by owner
// @access  Private (Owner)
router.put('/owner/:id/status', authenticateUser, authorizeRoles('owner'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Confirmed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }

    const booking = await Booking.findById(req.params.id).populate('facility');
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    if (booking.facility.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'You are not authorized to update this booking' });
    }

    booking.status = status;
    await booking.save();
    res.status(200).json({ msg: 'Booking status updated successfully', booking });
  } catch (error) {
    console.error('Error updating booking status:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/owner/report', authenticateUser, authorizeRoles('owner'), async (req, res) => {
  try {
    const facilities = await Facility.find({ owner: req.user._id }).select('_id');
    const facilityIds = facilities.map(f => f._id);

    const bookings = await Booking.find({ facility: { $in: facilityIds } });

    const totalBookings = bookings.length;
    const totalRevenue = bookings
      .filter(b => b.status === 'Confirmed')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    res.status(200).json({ totalBookings, totalRevenue });
  } catch (error) {
    console.error('Error generating report:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});



// @route   PUT /api/bookings/:id/status
// @desc    Update booking status by admin
// @access  Private (Admin)
router.put('/admin/:id/status', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Confirmed', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    res.status(200).json({ message: 'Booking status updated successfully', booking });
  } catch (error) {
    console.error('Error updating booking status:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bookings/:id
router.delete('/:id', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ msg: 'Booking not found' });

    await booking.deleteOne();
    res.status(200).json({ msg: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/bookings/my
// @desc    Get current user's bookings
router.get('/my', authenticateUser, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('facility', 'name address')
      .populate('sportId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching my bookings:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});


// @route   GET /api/bookings/history
// @desc    Get user's booking history
router.get('/history', authenticateUser, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('facility sportId');
    res.status(200).json(bookings);
  } catch (err) {
    console.error('Error fetching booking history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/availability
// @desc    Check booked resources per time slot
router.get('/availability', async (req, res) => {
  try {
    const { facilityId, sportId, date } = req.query;

    if (!facilityId || !sportId || !date) {
      return res.status(400).json({ message: 'facilityId, sportId, and date are required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    const bookings = await Booking.find({
      facility: facilityId,
      sportId: sportId,
      date,
      status: { $ne: 'Cancelled' }
    });

    const slotMap = {};

    bookings.forEach((booking) => {
      if (!booking.timeSlot || !booking.duration || !booking.numberOfResources) {
        console.warn("⚠️ Missing fields in booking:", booking);
        return;
      }
      const startHour = parseInt(booking.timeSlot.split(':')[0]);

      // ✅ Ignore past bookings for today's date
      if (date === today && (startHour + booking.duration) <= currentHour) return;

      for (let i = 0; i < booking.duration; i++) {
        const hour = String(startHour + i).padStart(2, '0') + ':00';
        if (!slotMap[hour]) {
          slotMap[hour] = 0;
        }
        slotMap[hour] += booking.numberOfResources;
      }
    });

    const availabilityArray = Object.entries(slotMap).map(([timeSlot, bookedResources]) => ({
      timeSlot,
      bookedResources,
    }));

    res.status(200).json(availabilityArray);
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
