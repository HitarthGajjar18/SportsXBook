import React, { useEffect, useState } from 'react';
import api from '../api';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button ,Spinner } from 'react-bootstrap';
import './FacilitiesPage.css';
import { useNavigate } from 'react-router-dom';

const FacilitiesPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sport = searchParams.get('sport');
  console.log('Selected sport:', sport); // Add this log to check the sport parameter

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const { data } = await api.get(`/facilities/sport/${sport}`);
        console.log('Fetched data:', data); // Add this log to check the response data
        setFacilities(data || []); 
      } catch (error) {
        console.error('Error fetching facilities:', error);
        setFacilities([]);
      } finally {
        setLoading(false);
      }
    };

    if (sport) fetchFacilities();
  }, [sport]);

  const handleBookNow = (facilityId) => {
    navigate(`/facility-detail/${facilityId}`); // Navigate to the Facility Detail Page for this facility
  };

  return (
    <Container className="facilities-container">
      <h2 className="facilities-heading">Facilities for {sport}</h2>

      {loading ? (
        <div className="loading-spinner">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row>
          {facilities.length > 0 ? (
            facilities.map((facility) => (
              <Col md={4} sm={6} xs={12} key={facility._id} className="mb-4">
                <Card className="facility-card">
                <Card.Img
                    variant="top"
                    src={facility.photo?.[0] ? `http://localhost:5000${facility.photo[0]}` : '/default-fallback.jpg'}
                    alt={facility.name}
                />
                  <Card.Body>
                    <Card.Title className="facility-title">{facility.name}</Card.Title>
                    <Card.Text className="facility-description">{facility.description}</Card.Text>
                    <Card.Text><strong>Address:</strong> {facility.address}</Card.Text>
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
            <div className="no-facilities-message">
              No facilities found for {sport}.
            </div>
          )}
        </Row>
      )}
    </Container>
  );
};

export default FacilitiesPage;
