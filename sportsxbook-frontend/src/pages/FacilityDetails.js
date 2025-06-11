import React, { useEffect, useState } from 'react';
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Form,
  Alert,
} from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './FacilityDetails.css';
import { FaStar, FaRegStar } from 'react-icons/fa';


const FacilityDetails = () => {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState({});
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review-related states
  const [review, setReview] = useState({ rating: '', comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;


  useEffect(() => {
    const fetchFacilityDetails = async () => {
      try {
        const { data } = await api.get(`/facilities/${facilityId}`);
        setFacility(data);

        const sportsData = await api.get('/sports/sport');
        setSports(sportsData.data);
      } catch (error) {
        console.error('Error fetching facility details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilityDetails();
  }, [facilityId]);

  const handleBookNow = (sportName) => {
    navigate(`/book/${facilityId}/${sportName}`);
  };
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <FaStar key={i} color="#ffc107" />
        ) : (
          <FaRegStar key={i} color="#ccc" />
        )
      );
    }
    return stars;
  };
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMsg('You must be logged in to submit a review.');
        return;
      }

      await api.post(
        `/facilities/${facilityId}/reviews`,
        review,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReviewSubmitted(true);
      setReview({ rating: '', comment: '' });

      const { data: updatedFacility } = await api.get(`/facilities/${facilityId}`);
      setFacility(updatedFacility);
    } catch (error) {
      console.error('Error submitting review:', error);
      setErrorMsg(
        error?.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    }
  };

  const calculateAverageRating = () => {
    if (!facility.reviews || facility.reviews.length === 0) return 0;
    const total = facility.reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / facility.reviews.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  const sortedReviews = facility.reviews
  ? [...facility.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  : [];

const indexOfLastReview = currentPage * reviewsPerPage;
const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
const visibleReviews = sortedReviews.slice(indexOfFirstReview, indexOfLastReview);


  return (
    <Container className="py-5">
      <h2 className="text-center mb-4">{facility.name}</h2>

      <Row className="mb-4">
        <Col md={6}>
          <Card.Img
            variant="top"
            src={
              facility.photo && facility.photo.length > 0
                ? `http://localhost:5000${facility.photo[0]}`
                : '/default-fallback.jpg'
            }
            alt={facility.name}
            className="img-fluid rounded"
          />
        </Col>

        <Col md={6}>
          <p>{facility.description}</p>
          <p><strong>📞 Contact:</strong> {facility.contactNumber}</p>
          <p><strong>📍 Address:</strong> {facility.address}</p>

          <p><strong>🏷️ Amenities:</strong></p>
          {facility.amenities && facility.amenities.length > 0 ? (
            <ul>
              {facility.amenities.map((amenity, idx) => (
                <li key={idx}>{amenity}</li>
              ))}
            </ul>
          ) : (
            <p>N/A</p>
          )}
        </Col>
      </Row>

      {/* Booking Buttons */}
      <div className="text-center mb-4">
        {facility.sports && facility.sports.length > 0 ? (
          facility.sports.map((sportObj) => {
            const matchingSport = sports.find(
              (s) => s._id === sportObj.sportId
            );
            if (!matchingSport) return null;

            return (
              <Button
                key={sportObj._id}
                style={{ backgroundColor: '#38BDF8', border: 'none', margin: '8px' }}
                onClick={() => handleBookNow(matchingSport.name)}
              >
                Book {matchingSport.name}
              </Button>
            );
          })
        ) : (
          <p>No sports available for this facility.</p>
        )}
      </div>

      <hr />

      {/* Review Summary */}
      <h4 className="mt-4">
        Reviews ({facility.reviews?.length || 0}) — ⭐ {calculateAverageRating()}
      </h4>

      {visibleReviews && visibleReviews.length > 0 ? (
        visibleReviews.map((rev) => (
          <Card key={rev._id} className="mb-3 shadow-sm">
            <Card.Body>
            <Card.Title>
              {rev.user?.fullName || 'Anonymous'} — {renderStars(rev.rating)}
            </Card.Title>
              <Card.Text>{rev.comment}</Card.Text>
              <small className="text-muted">
                {new Date(rev.createdAt).toLocaleString()}
              </small>
            </Card.Body>
          </Card>
        ))
      ) : (
        <p>No reviews yet.</p>
      )}

      {facility.reviews && facility.reviews.length > reviewsPerPage && (
        <div className="d-flex justify-content-center align-items-center gap-2 my-3">
          <Button
            variant="outline-primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {Math.ceil(facility.reviews.length / reviewsPerPage)}
          </span>
          <Button
            variant="outline-primary"
            disabled={indexOfLastReview >= facility.reviews.length}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}



      {/* Review Form */}
      {!reviewSubmitted ? (
        <Form onSubmit={handleReviewSubmit} className="mt-4">
          <h5>Leave a Review</h5>
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <div style={{ fontSize: '1.5rem' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setReview({ ...review, rating: star })}
                >
                  {star <= review.rating ? (
                    <FaStar color="#ffc107" />
                  ) : (
                    <FaRegStar color="#ccc" />
                  )}
                </span>
              ))}
            </div>
          </Form.Group>


          <Form.Group className="mb-3">
            <Form.Label>Comment</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
              required
            />
          </Form.Group>

          <Button type="submit" style={{ backgroundColor: '#38BDF8', border: 'none' }}>
            Submit Review
          </Button>
        </Form>
      ) : (
        <Alert variant="success" className="mt-3">
          Review submitted successfully!
        </Alert>
      )}
    </Container>
  );
};

export default FacilityDetails;
