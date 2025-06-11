const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const Facility = require('../models/Facility');
const upload = require('../middleware/uploadMiddleware');
const Sport = require('../models/Sports');

// ---------------------------- PUBLIC ROUTES ---------------------------- //

// @route   GET /api/facilities/search
router.get('/search', async (req, res) => {
  try {
    const { keyword, location, sport, minPrice, maxPrice } = req.query;
    let query = {};

    if (keyword) query.name = { $regex: keyword, $options: 'i' };
    if (location) query.address = { $regex: location, $options: 'i' };
    if (sport) query['sports.name'] = { $regex: sport, $options: 'i' };

    if (minPrice || maxPrice) {
      query['sports.price'] = {};
      if (minPrice) query['sports.price'].$gte = Number(minPrice);
      if (maxPrice) query['sports.price'].$lte = Number(maxPrice);
    }

    const facilities = await Facility.find(query);
    res.status(200).json(facilities);
  } catch (error) {
    console.error('Error searching facilities:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/facilities/sport/:sportName
router.get('/sport/:sportName', async (req, res) => {
  try {
    const { sportName } = req.params;
    const sport = await Sport.findOne({ name: sportName });

    if (!sport) return res.status(404).json({ message: 'Sport not found' });

    const facilities = await Facility.find({ 'sports.sportId': sport._id });
    if (!facilities.length) return res.status(404).json({ message: 'No facilities found for this sport' });

    res.status(200).json(facilities);
  } catch (error) {
    console.error('Error fetching facilities by sport:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/facilities
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find()
      .populate('owner', 'fullName email') // ✅ Populates owner
      .populate('sports.sportId', 'name type'); // ✅ Populates nested sportId

    res.status(200).json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});



// ---------------------------- AUTHENTICATED ROUTES ---------------------------- //

// @route   GET /api/facilities/owner
// Get facilities owned by logged-in owner
router.get('/owner', authenticateUser, async (req, res) => {
  try {
    const facilities = await Facility.find({ owner: req.user._id }).populate('owner', 'name email');
    if (!facilities.length) return res.status(404).json({ message: 'No facilities found for this owner' });

    res.status(200).json(facilities);
  } catch (error) {
    console.error('Error fetching owner facilities:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/facilities/add-facility
// Add new facility (Owner only)
router.post(
  '/add-facility',
  authenticateUser,
  authorizeRoles('owner'),
  upload.single('photo'),
  async (req, res) => {
    try {
      const { name, address, description, contactNumber } = req.body;

      // ✅ Parse amenities and sports from JSON strings
      const amenities = JSON.parse(req.body.amenities);
      const sports = JSON.parse(req.body.sports);

      console.log('Parsed amenities:', amenities);
      console.log('Parsed sports:', sports);
      console.log('Contact Number:', contactNumber);

      // ✅ Basic validation
      if (!name || !address || !sports || !Array.isArray(sports)) {
        return res.status(400).json({ message: 'Missing or invalid fields' });
      }

      for (let sport of sports) {
        if (
          !sport.sportId ||
          !sport.noOfResources ||
          !sport.maxPeoplePerUnit ||
          !sport.operatingHours ||
          !sport.price
        ) {
          return res.status(400).json({ message: 'Missing required sport attributes' });
        }
      }

      const newFacility = new Facility({
        name,
        address,
        description,
        photo: req.file ? req.file.path : '',
        amenities,
        contactNumber,
        sports,
        owner: req.user._id
      });

      const savedFacility = await newFacility.save();
      res.status(201).json(savedFacility);
    } catch (error) {
      console.error('Error adding facility:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


// ---------------------------- REVIEWS ---------------------------- //

// @route   POST /api/facilities/:id/reviews
// Add a review (User)
router.post('/:id/reviews', authenticateUser, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const facility = await Facility.findById(req.params.id);

    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    const alreadyReviewed = facility.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this facility' });
    }

    // Add the new review
    facility.reviews.push({ user: req.user._id, rating: Number(rating), comment });

    // Recalculate average rating
    facility.averageRating =
      facility.reviews.reduce((acc, item) => item.rating + acc, 0) / facility.reviews.length;

    await facility.save();

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/facilities/:facilityId/reviews/:reviewId
// Delete a review (Admin only)
router.delete('/:facilityId/reviews/:reviewId', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.facilityId);

    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    facility.reviews = facility.reviews.filter(
      (review) => review._id.toString() !== req.params.reviewId
    );

    facility.averageRating =
      facility.reviews.length > 0
        ? facility.reviews.reduce((acc, item) => item.rating + acc, 0) / facility.reviews.length
        : 0;

    await facility.save();

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------- OWNER FACILITY MANAGEMENT ---------------------------- //

// @route   PUT /api/facilities/owner/:id
// Update a facility (Owner only)
router.put('/owner/:id', authenticateUser, authorizeRoles('owner'), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id)
    .populate({
      path: 'reviews.user',
      select: 'fullName',
    })
    .lean();
  
  if (facility && facility.reviews) {
    facility.reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    if (facility.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this facility' });
    }

    const { sports } = req.body;
    if (sports) {
      for (let sport of sports) {
        if (!sport.sportId || !sport.noOfResources || !sport.maxPeoplePerUnit || !sport.operatingHours || !sport.price) {
          return res.status(400).json({ message: 'Missing required sport attributes for update' });
        }
      }
    }

    const updatedFacility = await Facility.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.status(200).json(updatedFacility);
  } catch (error) {
    console.error('Error updating facility:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/facilities/owner/:id
// Delete a facility (Owner only)
router.delete('/owner/:id', authenticateUser, authorizeRoles('owner'), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    if (facility.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this facility' });
    }

    await facility.deleteOne();
    res.status(200).json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------- ADMIN FACILITY MANAGEMENT ---------------------------- //

// @route   DELETE /api/facilities/admin/:id
// Admin deletes any facility
router.delete('/admin/:id', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    await facility.deleteOne();
    res.status(200).json({ message: 'Facility deleted successfully by Admin' });
  } catch (error) {
    console.error('Error deleting facility by admin:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------- GET SINGLE FACILITY ---------------------------- //

// @route   GET /api/facilities/:facilityId
// Get facility by ID (Public)
router.get('/:facilityId', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.facilityId)
      .populate('reviews.user', 'fullName email'); // Populate review's user details

    if (!facility) return res.status(404).json({ message: 'Facility not found' });

    res.status(200).json(facility);
  } catch (error) {
    console.error('Error fetching facility by ID:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});
module.exports = router;
