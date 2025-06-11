import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container } from 'react-bootstrap';
import api from '../api';
import './Register.css'

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');  // Default to 'user'

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    const birthDate = new Date(dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const m = new Date().getMonth() - birthDate.getMonth();
    const d = new Date().getDate() - birthDate.getDate();
    const exactAge = m < 0 || (m === 0 && d < 0) ? age - 1 : age;
  
    if (exactAge < 16) {
      alert('You must be at least 16 years old to register.');
      return;
    }
  
    try {
      await api.post('/register', {
        fullName,
        email,
        password,
        confirmPassword,
        address,
        dateOfBirth,
        phone,
        role,  // Add role
      });
      navigate('/login');
    } catch (error) {
      console.error('Registration error', error.response?.data?.msg || error.message);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className='register-form-wrapper'>
      <Container className="py-5">
        <h2 className="text-center mb-4">Register</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Date of Birth</Form.Label>
            <Form.Control
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
              required
            />

          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Control as="select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="owner">Owner</option>
              {/* <option value="admin">Admin</option> */}
            </Form.Control>
          </Form.Group>
          <Button type="submit" variant="primary" className="w-100">Register</Button>
          <div className="login-link">
          <p>Already have an account? <a href="/login">Login</a></p>
        </div>
        </Form>
      </Container>
    </div>
  );
};

export default Register;
