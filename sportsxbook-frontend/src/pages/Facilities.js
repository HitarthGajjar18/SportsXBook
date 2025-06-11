import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import api from '../api';
import './Facilities.css';

const Facilities = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const { data } = await api.get('/facilities');
        setFacilities(data);
      } catch (error) {
        console.error('Error fetching facilities', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  // Handle the "Book Now" button click
  const handleBookNow = (facilityId) => {
    navigate(`/facility-detail/${facilityId}`); // Navigate to the Facility Detail Page for this facility
  };

  return (
    <Container className="py-5">
      <h2 className="text-center mb-5">Our Available Facilities</h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Row>
          {facilities.length > 0 ? (
            facilities.map((facility) => (
              <Col md={4} key={facility._id} className="mb-4">
                <Card className="facility-card">
                  <Card.Img
                    variant="top"
                    src={facility.photo ? `http://localhost:5000${facility.photo}` : '/default-fallback.jpg'}
                    alt={facility.name}
                    className="facility-image"
                  />
                  <Card.Body>
                    <Card.Title>{facility.name}</Card.Title>
                    <Card.Text>{facility.description}</Card.Text>
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={() => handleBookNow(facility._id)} // When clicked, navigate to the facility details
                    >
                      Book Now
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <div className="text-center w-100">No facilities found.</div>
          )}
        </Row>
      )}
    </Container>
  );
};

export default Facilities;
