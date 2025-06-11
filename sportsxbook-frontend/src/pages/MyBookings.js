import React, { useEffect, useState } from 'react';
import moment from 'moment';
import api from '../api';
import { Button, Card, Container } from 'react-bootstrap';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [activeSection, setActiveSection] = useState('upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await api.get('/bookings/my', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setBookings(data);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
      }
    };
    fetchBookings();
  }, []);

  const categorizeBookings = () => {
    const now = moment();
    const upcoming = [];
    const ongoing = [];
    const completed = [];

    bookings.forEach(b => {
      const bookingDate = moment(b.date, "YYYY-MM-DD");
      const bookingStart = moment(`${b.date} ${b.timeSlot}`, "YYYY-MM-DD h:mm A");
      const bookingEnd = bookingStart.clone().add(b.duration, 'hours');

      if (bookingDate.isAfter(now, 'day')) {
        upcoming.push(b);
      } else if (now.isBetween(bookingStart, bookingEnd)) {
        ongoing.push(b);
      } else if (bookingEnd.isBefore(now)) {
        completed.push(b);
      } else if (bookingDate.isSame(now, 'day') && now.isBefore(bookingStart)) {
        upcoming.push(b); // same-day future slot
      } else {
        completed.push(b); // fallback
      }
    });

    return { upcoming, ongoing, completed };
  };

  const { upcoming, ongoing, completed } = categorizeBookings();

  const renderBookings = (bookingsList, label) => {
    if (!bookingsList.length) {
      return <p className="text-muted">No {label} bookings</p>;
    }

    return bookingsList.map((b, i) => (
      <Card key={i} className="mb-3">
        <Card.Body>
          <Card.Title>{b.sportId?.name} at {b.facility?.name}</Card.Title>
          <p><strong>Date:</strong> {b.date}</p>
          <p><strong>Time:</strong> {b.timeSlot} ({b.duration} hrs)</p>
          <p><strong>Resources:</strong> {b.numberOfResources}</p>
          <p><strong>People:</strong> {b.numberOfPeople}</p>
          <p><strong>Payment:</strong> {b.paymentMode}</p>
          <p><strong>Status:</strong> {b.status || 'Confirmed'}</p>
        </Card.Body>
      </Card>
    ));
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">My Bookings</h2>
      <div className="d-flex justify-content-center mb-4 gap-3">
        <Button
          variant={activeSection === 'upcoming' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveSection('upcoming')}
        >
          Upcoming
        </Button>
        <Button
          variant={activeSection === 'ongoing' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveSection('ongoing')}
        >
          Ongoing
        </Button>
        <Button
          variant={activeSection === 'completed' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveSection('completed')}
        >
          Completed
        </Button>
      </div>

      {activeSection === 'upcoming' && renderBookings(upcoming, 'upcoming')}
      {activeSection === 'ongoing' && renderBookings(ongoing, 'ongoing')}
      {activeSection === 'completed' && renderBookings(completed, 'past')}
    </Container>
  );
};

export default MyBookings;
