
import React, { useEffect, useState } from 'react';
import { Button , Modal , Form} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './OwnerDashboard.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const OwnerDashboard = () => {
  const [activeSection, setActiveSection] = useState('facilities');
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [report, setReport] = useState(null);
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    contactNumber: '',
    images: '',
    sport: '',
    amenities: [],
    pricing: '',
    operatingHours: '',
    numberOfResources: '',
    maxPeoplePerResource: '',
    isAvailable: true,
  });

  useEffect(() => {
    if (activeSection === 'facilities') fetchFacilities();
    if (activeSection === 'bookings') fetchBookings();
    if (activeSection === 'reports') fetchReport();
  }, [activeSection]);

  const fetchFacilities = async () => {
    try {
      const { data } = await api.get('/facilities/owner', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching owner facilities', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/owner', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setBookings(data);
    } catch (error) {
      console.error('Error fetching owner bookings', error);
    }
  };

  const fetchReport = async () => {
    try {
      const { data } = await api.get('/bookings/owner/report', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setReport(data);
    } catch (error) {
      console.error('Error fetching report', error);
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    const confirmAction = window.confirm(`Are you sure you want to ${newStatus === 'Cancelled' ? 'cancel' : 'confirm'} this booking?`);
    if (!confirmAction) return;

    try {
      await api.put(`/bookings/owner/${bookingId}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchBookings(); // refresh list
    } catch (error) {
      console.error('Error updating booking status', error);
    }
  };

  const isPastBooking = (dateStr) => {
    const today = new Date();
    const bookingDate = new Date(dateStr);
    return bookingDate < today.setHours(0, 0, 0, 0);
  };

  const deleteFacility = async (facilityId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this facility?');
    if (!confirmDelete) return;
  
    try {
      await api.delete(`/owner/${facilityId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchFacilities(); // Refresh list after deletion
    } catch (error) {
      console.error('Error deleting facility', error);
      alert('Failed to delete facility. Please try again.');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    if (name === 'amenities') {
      if (checked) {
        setFormData(prev => ({ ...prev, amenities: [...prev.amenities, value] }));
      } else {
        setFormData(prev => ({
          ...prev,
          amenities: prev.amenities.filter(item => item !== value),
        }));
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleEditClick = (facility) => {
    setSelectedFacility(facility);
    setFormData({
      name: facility.name,
      address: facility.address,
      description: facility.description,
      contactNumber: facility.contactNumber,
      images: facility.images.join(', '),
      sport: facility.sport,
      amenities: facility.amenities || [],
      pricing: facility.pricing,
      operatingHours: facility.operatingHours,
      numberOfResources: facility.numberOfResources,
      maxPeoplePerResource: facility.maxPeoplePerResource,
      isAvailable: facility.isAvailable,
    });
    setShowEditModal(true);
  };
  
  const handleUpdateFacility = async () => {
    try {
      const updatedData = {
        ...formData,
        images: formData.images.split(',').map(url => url.trim()),
      };
  
      const { data } = await api.put(`/owner/${selectedFacility._id}`, updatedData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
  
      setFacilities(prev =>
        prev.map(fac => (fac._id === data._id ? data : fac))
      );
      setShowEditModal(false);
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update facility.');
    }
  };
  
  const generateReportPDF = async (facilityId = null) => {
    let fullBookings = bookings;
  
    // If full bookings not present, fetch them
    if (!facilityId && !bookings.length) {
      const { data } = await api.get('/bookings/owner', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fullBookings = data;
    }
  
    const doc = new jsPDF();
    const title = facilityId ? `Bookings for Facility ID: ${facilityId}` : 'All Bookings Report';
    doc.text(title, 14, 15);
  
    const filteredBookings = facilityId
      ? fullBookings.filter(b => b.facility?._id === facilityId)
      : fullBookings;
  
    const tableData = filteredBookings.map((b, index) => [
      index + 1,
      b.user?.fullName || 'N/A',
      b.facility?.name || 'N/A',
      b.date,
      b.timeSlot,
      b.totalPrice,
      b.status
    ]);
  
    if (!tableData.length) {
      doc.text("No bookings available.", 14, 30);
    } else {
      doc.autoTable({
        startY: 25,
        head: [['#', 'User', 'Facility', 'Date', 'Time', 'Price', 'Status']],
        body: tableData
      });
    }
  
    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };
  
  
  
  
  const renderSection = () => {
    switch (activeSection) {
      case 'facilities':
      return (
        <div>
          <h2>Your Facilities</h2>
          <div className="facility-card-container">
          {facilities.map(facility => (
            <div className="facility-card" key={facility._id}>
              <img src={facility.photo ? `http://localhost:5000${facility.photo}` : '/default-fallback.jpg'} alt={facility.photo} className="facility-image" />
              <div className="facility-details">
                <h5>{facility.name}</h5>
                <p>{facility.description}</p>
              </div>
              <div style={{ marginTop: '10px' }}>
              <Button variant="warning" onClick={() => handleEditClick(facility)}>
                Edit
              </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => deleteFacility(facility._id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          </div>
        </div>
      );
      case 'bookings':
        return (
          <div>
            <h2>Your Bookings</h2>
            <ul>
              {bookings.map(booking => {
                const past = isPastBooking(booking.date);
                return (
                  <li key={booking._id} style={{ marginBottom: '1rem' }}>
                    <strong>User:</strong> {booking.user?.fullName || 'Unknown'}<br />
                    <strong>Facility:</strong> {booking.facility?.name || 'N/A'}<br />
                    <strong>Date:</strong> {booking.date} | <strong>Time:</strong> {booking.timeSlot}<br />
                    <strong>Total Price:</strong> ₹{booking.totalPrice}<br />
                    <strong>Status:</strong> {booking.status}<br />
                    {!past && booking.status === 'Confirmed' && (
                      <Button variant="danger" size="sm" onClick={() => updateBookingStatus(booking._id, 'Cancelled')} className="mt-2">
                        Cancel Booking
                      </Button>
                    )}
                    {!past && booking.status === 'Cancelled' && (
                      <Button variant="success" size="sm" onClick={() => updateBookingStatus(booking._id, 'Confirmed')} className="mt-2">
                        Confirm Booking
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      case 'reports':
      return (
        <>
          <div className="report-summary">
            <div className="report-box">
              <h4>Total Bookings</h4>
              <p>{report ? report.totalBookings : '...'}</p>
            </div>
            <div className="report-box">
              <h4>Total Revenue</h4>
              <p>₹{report ? report.totalRevenue : '...'}</p>
            </div>
          </div>

          <Button variant="primary" className="mb-3" onClick={() => generateReportPDF()}>
            Download All Bookings PDF
          </Button>

          <h4>Facility-wise Reports:</h4>
          {facilities.map(facility => (
            <div key={facility._id} className="mb-2">
              <p><strong>{facility.name}</strong></p>
              <Button variant="secondary" onClick={() => generateReportPDF(facility._id)}>
                Download Report for {facility.name}
              </Button>
            </div>
          ))}
        </>
      );

      default:
        return null;
    }
  };

  return (
    <>
    <div className="owner-dashboard-container" style={{ display: 'flex' }}>
      <div className="sidebar">
        <button
          className={activeSection === 'facilities' ? 'active' : ''}
          onClick={() => setActiveSection('facilities')}
        >
          My Facility
        </button>
        <button
          className={activeSection === 'add-facility' ? 'active' : ''}
          onClick={() => navigate('/owner/add-facility')}
        >
          Add New Facility
        </button>
        <button
          className={activeSection === 'bookings' ? 'active' : ''}
          onClick={() => setActiveSection('bookings')}
        >
          My Bookings
        </button>
        <button
          className={activeSection === 'reports' ? 'active' : ''}
          onClick={() => setActiveSection('reports')}
        >
          Reports
        </button>
      </div>

      <div className="content">
        {renderSection()}
      </div>
    </div>
    <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Edit Facility</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Facility Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </Form.Group>
  
        <Form.Group className="mb-3">
          <Form.Label>Address</Form.Label>
          <Form.Control
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
        </Form.Group>
  
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="description"
            value={formData.description}
            onChange={handleInputChange}
          />
        </Form.Group>
  
        <Form.Group className="mb-3">
          <Form.Label>Contact Number</Form.Label>
          <Form.Control
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleInputChange}
          />
        </Form.Group>
  
        <Form.Group className="mb-3">
          <Form.Label>Images (comma-separated URLs)</Form.Label>
          <Form.Control
            type="text"
            name="images"
            value={formData.images}
            onChange={handleInputChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Sport</Form.Label>
          <Form.Control
            type="text"
            name="sport"
            value={formData.sport}
            onChange={handleInputChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Amenities</Form.Label>
          <div>
            {['Parking', 'Washroom', 'Water', 'Locker'].map((amenity) => (
              <Form.Check
                inline
                key={amenity}
                label={amenity}
                name="amenities"
                type="checkbox"
                value={amenity}
                checked={formData.amenities.includes(amenity)}
                onChange={handleInputChange}
              />
            ))}
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Pricing (per hour)</Form.Label>
          <Form.Control
            type="number"
            name="pricing"
            value={formData.pricing}
            onChange={handleInputChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Operating Hours (e.g. 9:00 AM - 9:00 PM)</Form.Label>
          <Form.Control
            type="text"
            name="operatingHours"
            value={formData.operatingHours}
            onChange={handleInputChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Number of Resources</Form.Label>
          <Form.Control
            type="number"
            name="numberOfResources"
            value={formData.numberOfResources}
            onChange={handleInputChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Max People per Resource</Form.Label>
          <Form.Control
            type="number"
            name="maxPeoplePerResource"
            value={formData.maxPeoplePerResource}
            onChange={handleInputChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Is Available"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleInputChange}
          />
        </Form.Group>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowEditModal(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleUpdateFacility}>
        Save Changes
      </Button>
    </Modal.Footer>
  </Modal>
  </>
  );
};

export default OwnerDashboard;
