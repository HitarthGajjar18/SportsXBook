import React, { useEffect, useState } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import api from '../api';
import { useNavigate } from 'react-router-dom';


const AddFacility = () => {
  const [sportsList, setSportsList] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    amenities: [],
    contactNumber: '',
    photo: null,
    sports: [
      {
        sportId: '',
        noOfResources: '',
        maxPeoplePerUnit: '',
        operatingHours: {
          days: 'All Days',
          opening: '',
          closing: ''
        },
        price: '',
        status: 'active'
      }
    ]
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSports = async () => {
      const { data } = await api.get('/sports/sport');
      setSportsList(data);
    };
    fetchSports();
  }, []);

  const handleSportChange = (index, field, value) => {
    const updatedSports = [...formData.sports];
    if (field.includes('.')) {
      const [outer, inner] = field.split('.');
      updatedSports[index][outer][inner] = value;
    } else {
      updatedSports[index][field] = value;
    }
    setFormData({ ...formData, sports: updatedSports });
  };

  const addSportField = () => {
    setFormData({
      ...formData,
      sports: [
        ...formData.sports,
        {
          sportId: '',
          noOfResources: '',
          maxPeoplePerUnit: '',
          operatingHours: { days: 'All Days', opening: '', closing: '' },
          price: '',
          status: 'active'
        }
      ]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
  
    payload.append('name', formData.name);
    payload.append('address', formData.address);
    payload.append('description', formData.description);
    payload.append('contactNumber', formData.contactNumber);
    payload.append('amenities', JSON.stringify(formData.amenities)); // ✅ Fix
    if (formData.photo) payload.append('photo', formData.photo);
  
    payload.append('sports', JSON.stringify(formData.sports)); // ✅ Fix
  
    try {
      await api.post('/facilities/add-facility', payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/owner-dashboard');
    } catch (error) {
      console.error('Error adding facility:', error);
    }
  };
  

  return (
    <Container className="py-4">
      <h2>Add New Facility</h2>
      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        <Form.Group>
          <Form.Label>Name</Form.Label>
          <Form.Control type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Address</Form.Label>
          <Form.Control type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
        </Form.Group>

        <Form.Group>
            <Form.Label>Amenities</Form.Label>
            <div className="mb-3">
                {[
                'WiFi',
                'Parking',
                'Restrooms',
                'Food Court',
                'Locker Rooms',
                'Changing Rooms',
                'Showers',
                'First Aid',
                'CCTV',
                'Air Conditioning'
                ].map(amenity => (
                <Form.Check
                    key={amenity}
                    type="checkbox"
                    label={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onChange={(e) => {
                    const updated = e.target.checked
                        ? [...formData.amenities, amenity]
                        : formData.amenities.filter(a => a !== amenity);
                    setFormData({ ...formData, amenities: updated });
                    }}
                />
                ))}
            </div>
        </Form.Group>


        <Form.Group>
          <Form.Label>Contact Number</Form.Label>
          <Form.Control type="text" value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} required />
        </Form.Group>
        <Form.Group>
          <Form.Label>Photo</Form.Label>
          <Form.Control type="file" onChange={e => setFormData({ ...formData, photo: e.target.files[0] })} />
        </Form.Group>

        <hr />
        <h4>Sports</h4>
        {formData.sports.map((sport, idx) => (
          <Row key={idx} className="mb-3">
            <Col>
              <Form.Label>Sport</Form.Label>
              <Form.Control as="select" value={sport.sportId} onChange={e => handleSportChange(idx, 'sportId', e.target.value)} required>
                <option value="">Select</option>
                {sportsList.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </Form.Control>
            </Col>
            <Col>
              <Form.Label>No. of Resources</Form.Label>
              <Form.Control type="number" value={sport.noOfResources} onChange={e => handleSportChange(idx, 'noOfResources', e.target.value)} required />
            </Col>
            <Col>
              <Form.Label>People/Unit</Form.Label>
              <Form.Control type="number" value={sport.maxPeoplePerUnit} onChange={e => handleSportChange(idx, 'maxPeoplePerUnit', e.target.value)} required />
            </Col>
            <Col>
              <Form.Label>Price</Form.Label>
              <Form.Control type="number" value={sport.price} onChange={e => handleSportChange(idx, 'price', e.target.value)} required />
            </Col>
            <Col>
              <Form.Label>Days</Form.Label>
              <Form.Control as="select" value={sport.operatingHours.days} onChange={e => handleSportChange(idx, 'operatingHours.days', e.target.value)}>
                <option>All Days</option>
                <option>Mon-Fri</option>
                <option>Sat-Sun</option>
              </Form.Control>
            </Col>
            <Col>
              <Form.Label>Open</Form.Label>
              <Form.Control type="time" value={sport.operatingHours.opening} onChange={e => handleSportChange(idx, 'operatingHours.opening', e.target.value)} />
            </Col>
            <Col>
              <Form.Label>Close</Form.Label>
              <Form.Control type="time" value={sport.operatingHours.closing} onChange={e => handleSportChange(idx, 'operatingHours.closing', e.target.value)} />
            </Col>
          </Row>
        ))}
        <Button variant="secondary" onClick={addSportField}>Add Another Sport</Button>
        <hr />
        <Button variant="primary" type="submit">Submit Facility</Button>
      </Form>
    </Container>
  );
};

export default AddFacility;
