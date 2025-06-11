import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Row, Col, Modal } from 'react-bootstrap';
import api from '../api';
import moment from 'moment';
import './Booking.css';
import { generateReceipt } from '../utils/generateReceipt';

const Booking = () => {
  const { facilityId, sport } = useParams();
  const navigate = useNavigate();

  const [facilityData, setFacilityData] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);
  const [noOfResources, setNoOfResources] = useState(0);
  const [timeSlotAvailability, setTimeSlotAvailability] = useState({});
  const [showModal, setShowModal] = useState(false);

  const [bookingDetails, setBookingDetails] = useState({
    date: '',
    duration: 1,
    timeSlot: '',
    numberOfResources: 1,
    numberOfPeople: 1,
    paymentMode: 'online',
  });

  const today = moment().format("YYYY-MM-DD");

  useEffect(() => {
    const fetchFacilityData = async () => {
      try {
        const { data } = await api.get(`/facilities/${facilityId}`);
        setFacilityData(data);

        const sportObj = data.sports.find((s) => {
          const facilitySportsMap = {
            "68171d6a6d4b40d4c000a014": "pool",
            "680e1907f6dd858b9ea978b4": "bowling",
            "680e32bf4cdcf3e2b6bc19e3": "pickleball",
          };
          const sportName = facilitySportsMap[s.sportId] || '';
          return sportName.toLowerCase() === sport.toLowerCase();
        });

        setSelectedSport(sportObj);
        setNoOfResources(sportObj.noOfResources);
      } catch (err) {
        console.error('Error fetching facility data:', err);
      }
    };

    fetchFacilityData();
  }, [facilityId, sport]);

  const generateTimeSlots = useCallback(() => {
    if (!selectedSport || !bookingDetails.duration) return [];

    const { opening, closing } = selectedSport.operatingHours;
    const openingTime = moment(opening, "h:mm A");
    const closingTime = moment(closing, "h:mm A");
    const duration = Math.min(parseInt(bookingDetails.duration), 5);

    const slots = [];
    let currentTime = openingTime.clone();

    const now = moment();
    const isToday = bookingDetails.date === today;

    if (isToday) {
      const currentHour = now.hour();
      const currentMinutes = now.minutes();
      const nextHour = currentMinutes > 0 ? currentHour + 1 : currentHour;

      if (currentTime.hour() < nextHour) {
        currentTime.set({ hour: nextHour, minute: 0 });
      }
    }

    while (currentTime.clone().add(duration, 'hour').isSameOrBefore(closingTime)) {
      const start = currentTime.clone();
      const end = currentTime.clone().add(duration, 'hour');

      const slotLabel = `${start.format("h:mm A")} to ${end.format("h:mm A")}`;
      slots.push({ label: slotLabel, start: start.format("h:mm A") });

      currentTime.add(1, 'hour');
    }

    return slots;
  }, [selectedSport, bookingDetails.duration, bookingDetails.date, today]);

  const fetchTimeSlotAvailability = useCallback(async () => {
    if (!bookingDetails.date || !selectedSport) return;

    try {
      const { data: bookings } = await api.get(`/bookings/availability`, {
        params: {
          facilityId,
          sportId: selectedSport.sportId,
          date: bookingDetails.date,
        }
      });

      const slots = generateTimeSlots();
      const duration = parseInt(bookingDetails.duration);
      const availabilityMap = {};

      slots.forEach(slot => {
        const slotStart = moment(slot.start, "h:mm A");
        const slotHours = [];
        for (let i = 0; i < duration; i++) {
          slotHours.push(slotStart.clone().add(i, "hours"));
        }

        let used = 0;
        bookings.forEach(b => {
          const bStart = moment(b.timeSlot, "h:mm A");
          const bHours = [];
          for (let i = 0; i < b.duration; i++) {
            bHours.push(bStart.clone().add(i, "hours"));
          }

          const overlaps = slotHours.some(sh => bHours.some(bh => sh.isSame(bh)));
          if (overlaps) used += b.numberOfResources;
        });

        const availableResources = Math.max(0, noOfResources - used);
        availabilityMap[slot.start] = availableResources;
      });

      setTimeSlotAvailability(availabilityMap);
    } catch (err) {
      console.error("Error fetching slot availability:", err);
    }
  }, [bookingDetails.date, selectedSport, bookingDetails.duration, noOfResources, facilityId, generateTimeSlots]);

  useEffect(() => {
    fetchTimeSlotAvailability();
  }, [fetchTimeSlotAvailability]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      setBookingDetails(prev => ({ ...prev, [name]: value, timeSlot: '' }));
      setTimeout(() => fetchTimeSlotAvailability(), 0);
      return;
    }

    setBookingDetails(prev => ({ ...prev, [name]: value }));

    if (name === "numberOfResources") {
      const resources = parseInt(value) || 1;
      const maxPeople = selectedSport?.maxPeoplePerUnit || 4;
      setBookingDetails(prev => ({
        ...prev,
        numberOfResources: resources,
        numberOfPeople: Math.min(prev.numberOfPeople, resources * maxPeople),
      }));
    }

    if (name === "numberOfPeople") {
      const people = parseInt(value) || 1;
      const maxPeople = (selectedSport?.maxPeoplePerUnit || 4) * bookingDetails.numberOfResources;
      if (people <= maxPeople) {
        setBookingDetails(prev => ({ ...prev, numberOfPeople: people }));
      }
    }

    if (name === "timeSlot") {
      setBookingDetails(prev => ({ ...prev, timeSlot: value }));
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedSport) return 0;
    return selectedSport.price * bookingDetails.duration * bookingDetails.numberOfResources;
  };

  const confirmBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const totalPrice = calculateTotalPrice();

      const bookingPayload = {
        facilityId,
        sportId: selectedSport.sportId,
        date: bookingDetails.date,
        timeSlot: bookingDetails.timeSlot,
        duration: bookingDetails.duration,
        numberOfResources: bookingDetails.numberOfResources,
        numberOfPeople: bookingDetails.numberOfPeople,
        paymentMode: bookingDetails.paymentMode,
        totalPrice,
      };

      const response = await api.post('/bookings', bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const savedBooking = response.data;
      generateReceipt(savedBooking);
      navigate('/my-bookings');
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to book. Please try again.");
    }
  };

  if (!facilityData || !selectedSport) return <div>Loading...</div>;

  const maxPeopleAllowed = (selectedSport.maxPeoplePerUnit || 4) * bookingDetails.numberOfResources;

  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">Book {sport} at {facilityData.name}</h2>
      <Row className="justify-content-center">
        <Col md={8}>
          <Form onSubmit={(e) => { e.preventDefault(); setShowModal(true); }}>
            <Form.Group className="mb-3" controlId="date">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                min={today}
                value={bookingDetails.date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="duration">
              <Form.Label>Duration (hours)</Form.Label>
              <Form.Select
                name="duration"
                value={bookingDetails.duration}
                onChange={handleInputChange}
                required
              >
                {[1, 2, 3, 4, 5].map((hour) => (
                  <option key={hour} value={hour}>{hour}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="timeSlot">
              <Form.Label>Time Slot</Form.Label>
              <div className="slot-grid">
                {generateTimeSlots().map((slotObj, idx) => {
                  const availableResources = timeSlotAvailability[slotObj.start];
                  const available = availableResources !== undefined && availableResources >= bookingDetails.numberOfResources;
                  const isSelected = bookingDetails.timeSlot === slotObj.start;
                  return (
                    <div
                      key={idx}
                      className={`time-slot-box ${isSelected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                      onClick={() => {
                        if (available) {
                          setBookingDetails(prev => ({ ...prev, timeSlot: slotObj.start }));
                        }
                      }}
                    >
                      <div>{slotObj.label}</div>
                      <div className="availability">{availableResources ?? '...'} available</div>
                    </div>
                  );
                })}
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="numberOfResources">
              <Form.Label>Number of Resources</Form.Label>
              <Form.Select
                name="numberOfResources"
                value={bookingDetails.numberOfResources}
                onChange={handleInputChange}
                required
              >
                {[...Array(noOfResources)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="numberOfPeople">
              <Form.Label>Number of People (Max {maxPeopleAllowed})</Form.Label>
              <Form.Select
                name="numberOfPeople"
                value={bookingDetails.numberOfPeople}
                onChange={handleInputChange}
                required
              >
                {[...Array(maxPeopleAllowed)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="paymentMode">
              <Form.Label>Payment Mode</Form.Label>
              <Form.Select
                name="paymentMode"
                value={bookingDetails.paymentMode}
                onChange={handleInputChange}
                required
              >
                {/* <option value="offline">Online</option> */}
                <option value="offline">Cash At Venue</option>
              </Form.Select>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 mt-3">
              Review & Confirm
            </Button>
          </Form>
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Your Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Sport:</strong> {sport}</p>
          <p><strong>Date:</strong> {bookingDetails.date}</p>
          <p><strong>Duration:</strong> {bookingDetails.duration} hour(s)</p>
          <p><strong>Time Slot:</strong> {bookingDetails.timeSlot}</p>
          <p><strong>Resources:</strong> {bookingDetails.numberOfResources}</p>
          <p><strong>People:</strong> {bookingDetails.numberOfPeople}</p>
          <p><strong>Total Price:</strong> ₹{calculateTotalPrice()}</p>
          <p><strong>Payment Mode:</strong> offline</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={confirmBooking}>Confirm Booking</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Booking;
