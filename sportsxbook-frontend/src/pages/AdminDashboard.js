import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import api from '../api';
import './AdminDashboard.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AdminDashboard = () => {
  const [sports, setSports] = useState([]);
  const [users, setUsers] = useState([]);
  const [owners, setOwners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sportToDelete, setSportToDelete] = useState(null);
  const [newSport, setNewSport] = useState({ name: '', description: '', image: null });
  const [activeSection, setActiveSection] = useState('sports');
  const [editSportId, setEditSportId] = useState(null);
  const [editSport, setEditSport] = useState({ name: '', description: '' });
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const { data } = await api.get('/sports/sport', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setSports(data);
      } catch (error) {
        console.error('Error fetching sports for admin', error);
      }
    };

    const fetchUsersByRole = async (role, setStateFn) => {
      try {
        const { data } = await api.get(`/admin/users?role=${role}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setStateFn(data);
      } catch (error) {
        console.error(`Error fetching ${role}s:`, error);
      }
    };

    fetchSports();
    fetchUsersByRole('user', setUsers);
    fetchUsersByRole('owner', setOwners);
  }, []);

  const handleAddSport = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newSport.name);
    formData.append('description', newSport.description);
    formData.append('image', newSport.image);

    try {
      const response = await api.post('/sports/add-sport', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setSports((prevSports) => [...prevSports, response.data.sport]);
      setShowModal(false);
      setNewSport({ name: '', description: '', image: null });
    } catch (error) {
      console.error('Error adding new sport', error);
    }
  };

  const confirmDeleteSport = (id) => {
    setSportToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await api.delete(`/sports/delete-sport/${sportToDelete}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSports((prev) => prev.filter((sport) => sport._id !== sportToDelete));
    } catch (error) {
      console.error('Error deleting sport', error);
    } finally {
      setShowDeleteModal(false);
      setSportToDelete(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;
    try {
      await api.delete(`/admin/delete-user/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };
  
  const handleDeleteOwner = async (ownerId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this owner and their facilities?');
    if (!confirmDelete) return;
    try {
      await api.delete(`/admin/delete-owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setOwners(prev => prev.filter(owner => owner._id !== ownerId));
    } catch (error) {
      console.error('Error deleting owner:', error);
    }
  };
  
  const fetchFacilities = async () => {
    try {
      const { data } = await api.get('/facilities', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };
  
  useEffect(() => {
    if (activeSection === 'bookings') {
      const fetchBookings = async () => {
        try {
          const response = await api.get('/bookings/admin', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          setBookings(response.data);
        } catch (error) {
          console.error('Error fetching bookings:', error);
        }
      };
      fetchBookings();
    }
  }, [activeSection]);

  const handleCancelBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/admin/${bookingId}/status`, {
        status: 'Cancelled',
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'Cancelled' } : b));
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };
  

  useEffect(() => {
    // Already calling fetchSports, fetchUsersByRole
    fetchFacilities(); // Add this
  }, []);

  const handleDeleteFacility = async (facilityId) => {
    const confirm = window.confirm('Are you sure you want to delete this facility?');
    if (!confirm) return;
  
    try {
      await api.delete(`/admin/${facilityId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setFacilities(prev => prev.filter(facility => facility._id !== facilityId));
    } catch (error) {
      console.error('Error deleting facility:', error);
    }
  };
  

  const handleEditSport = (sport) => {
    setEditSportId(sport._id);
    setEditSport({ name: sport.name, description: sport.description });
    setShowModal(true);
  };

  const handleUpdateSport = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/sports/update-sport/${editSportId}`, editSport, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSports((prev) =>
        prev.map((s) => (s._id === editSportId ? response.data : s))
      );
      setShowModal(false);
      setEditSportId(null);
      setEditSport({ name: '', description: '' });
    } catch (error) {
      console.error('Error updating sport', error);
    }
  };

  const handleFileChange = (e) => {
    setNewSport({ ...newSport, image: e.target.files[0] });
  };

  const generatePDF = (section) => {
    const doc = new jsPDF();
    let columns = [];
    let rows = [];
  
    switch (section) {
      case 'users':
        columns = ['Full Name', 'Email', 'Address', 'Date Of Birth'];
        rows = users.map(user => [user.fullName, user.email, user.address, user.dateOfBirth]);
        break;
      case 'owners':
        columns = ['Full Name', 'Email', 'Address', 'Date Of Birth'];
        rows = owners.map(owner => [owner.fullName, owner.email, owner.address, owner.dateOfBirth]);
        break;
      case 'facilities':
        columns = ['Name', 'Sport', 'Location', 'Owner'];
        rows = facilities.map(facility => [
          facility.name,
          facility.sports?.map(s => s.sportId?.name).join(', ') || 'N/A',
          facility.address,
          facility.owner?.fullName || 'N/A'
        ]);
        break;
      case 'bookings':
        columns = ['User', 'Facility', 'Sport', 'Date', 'Time'];
        rows = bookings.map(booking => [
          booking.user?.fullName || 'N/A',
          booking.facility?.name || 'N/A',
          booking.sport?.name || 'N/A',
          booking.date,
          booking.time
        ]);
        break;
      default:
        return;
    }
  
    doc.autoTable({
      head: [columns],
      body: rows,
    });
  
    doc.save(`${section}_report.pdf`);
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="side-panel">
        <h4>Admin Panel</h4>
        <div className="side-panel-buttons">
        <nav>
          <button onClick={() => setActiveSection('sports')}>Sports</button>
          <button onClick={() => setActiveSection('users')}>Users</button>
          <button onClick={() => setActiveSection('owners')}>Owners</button>
          <button onClick={() => setActiveSection('facilities')}>Facilities</button>
          <button onClick={() => setActiveSection('bookings')} className="sidebar-btn">Bookings</button>
        </nav>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {activeSection === 'sports' && (
          <section>
            <h2>Manage Sports</h2>
            <Button variant="primary" onClick={() => setShowModal(true)} className="mb-3">
              Add New Sport
            </Button>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Sport Name</th>
                  <th>Description</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sports.map((sport) => (
                  <tr key={sport._id}>
                    <td>{sport.name}</td>
                    <td>{sport.description}</td>
                    <td>
                      <img src={sport.image} alt={sport.name} width="60" />
                    </td>
                    <td>
                      <Button variant="warning" onClick={() => handleEditSport(sport)} className="me-2">Edit</Button>
                      <Button variant="danger" onClick={() => confirmDeleteSport(sport._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        )}

        {activeSection === 'users' && (
          <section>
            <h3>Users</h3>
            <Button className="download-pdf-button" onClick={() => generatePDF('users')}>Download PDF</Button>

            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Date Of Birth</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.address}</td>
                    <td>{u.dateOfBirth}</td>
                    <td>
                      <Button variant="danger" onClick={() => handleDeleteUser(u._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        )}


        {activeSection === 'owners' && (
          <section>
            <h3>Owners</h3>
            <Button className="download-pdf-button" onClick={() => generatePDF('owners')}>Download PDF</Button>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Date Of Birth</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((o) => (
                  <tr key={o._id}>
                    <td>{o.fullName}</td>
                    <td>{o.email}</td>
                    <td>{o.address}</td>
                    <td>{o.dateOfBirth}</td>
                    <td>
                      <Button variant="danger" onClick={() => handleDeleteOwner(o._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        )}

        {activeSection === 'facilities' && (
          <section>
            <h3>Facilities</h3>
            <Button className="download-pdf-button" onClick={() => generatePDF('facilities')}>Download PDF</Button>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Sport</th>
                  <th>Location</th>
                  <th>Owner</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((facility) => (
                  <tr key={facility._id}>
                    <td>{facility.name}</td>
                    <td>
                      {facility.sports && facility.sports.length > 0
                        ? facility.sports.map((s, idx) => (
                            <div key={idx}>{s.sportId?.name || 'N/A'}</div>
                          ))
                        : 'N/A'}
                    </td>
                    <td>{facility.address}</td>
                    <td>{facility.owner?.fullName || 'N/A'}</td>
                    <td>
                      <Button variant="danger" onClick={() => handleDeleteFacility(facility._id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </section>
        )}
        {activeSection === 'bookings' && (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">All Bookings <Button className="download-pdf-button" onClick={() => generatePDF('bookings')}>Download PDF</Button></h2>
            
            {bookings.length === 0 ? (
              <p>No bookings found.</p>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <div key={booking._id} className="border p-4 rounded shadow">
                    <p><strong>User:</strong> {booking.user?.fullName} ({booking.user?.email})</p>
                    <p><strong>Facility:</strong> {booking.facility?.name}</p>
                    <p><strong>Date:</strong> {booking.date}</p>
                    <p><strong>Time:</strong> {booking.timeSlot}</p>
                    <p><strong>Status:</strong> {booking.status}</p>
                    {booking.status !== 'Cancelled' && (
                      <button variant="danger"
                        onClick={() => handleCancelBooking(booking._id)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add/Edit Sport Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setEditSportId(null);
        setNewSport({ name: '', description: '', image: null });
      }}>
        <Modal.Header closeButton>
          <Modal.Title>{editSportId ? 'Edit Sport' : 'Add New Sport'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={editSportId ? handleUpdateSport : handleAddSport}>
            <Form.Group className="mb-3">
              <Form.Label>Sport Name</Form.Label>
              <Form.Control
                type="text"
                value={editSportId ? editSport.name : newSport.name}
                onChange={(e) =>
                  editSportId
                    ? setEditSport({ ...editSport, name: e.target.value })
                    : setNewSport({ ...newSport, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editSportId ? editSport.description : newSport.description}
                onChange={(e) =>
                  editSportId
                    ? setEditSport({ ...editSport, description: e.target.value })
                    : setNewSport({ ...newSport, description: e.target.value })
                }
                required
              />
            </Form.Group>

            {!editSportId && (
              <Form.Group className="mb-3">
                <Form.Label>Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </Form.Group>
            )}

            <Button variant="primary" type="submit" className="w-100">
              {editSportId ? 'Update Sport' : 'Add Sport'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this sport? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirmed}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
