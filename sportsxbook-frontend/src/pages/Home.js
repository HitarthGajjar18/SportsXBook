import React, { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Spinner , Carousel} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; 
import api from '../api';
import './Home.css'; 

const Home = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const { data } = await api.get('/sports/sport');
        setSports(data);
      } catch (error) {
        console.error('Error fetching sports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSports();
  }, []);

  const handleBookNow = (sportName) => {
    navigate(`/facilities?sport=${sportName}`); // ✅ navigate with sport as query param
  };

  return (
     <>
      <Carousel className="home-carousel" controls indicators fade interval={4000} pause={false} wrap={true} >
        {sports.map((sport) => (
          <Carousel.Item key={sport._id}>
            <div
              className="carousel-slide"
              style={{
                backgroundImage: `url(${
                  sport.image ? `http://localhost:5000${sport.image}` : '/default-fallback.jpg'
                })`,
              }}
            >
              <div className="carousel-overlay">
                <h2 className="carousel-title">{sport.name}</h2>
                <p className="carousel-subtitle">{sport.description}</p>
                <Button
                  variant="info"
                  className="carousel-button"
                  onClick={() => handleBookNow(sport.name)}
                >
                  Explore Facilities
                </Button>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>


    <Container className="py-5">
      <h2 className="text-center mb-5 home-title">Explore Our Sports</h2>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Row>
          {sports.length > 0 ? (
            sports.map(sport => (
              <Col md={4} key={sport._id} className="mb-4">
                <Card className="sport-card">
                  <Card.Img 
                    variant="top" 
                    src={sport.image ? `http://localhost:5000${sport.image}` : '/default-fallback.jpg'} 
                    alt={sport.name} 
                    className="sport-image" 
                  />
                  <Card.Body>
                    <Card.Title className="sport-title">{sport.name}</Card.Title>
                    <Card.Text>{sport.description}</Card.Text>
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={() => handleBookNow(sport.name)} 
                    >
                      Explore Facilities
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <div className="text-center w-100">No sports found.</div>
          )}
        </Row>
      )}
    </Container>
    </>
  );
};

export default Home;
