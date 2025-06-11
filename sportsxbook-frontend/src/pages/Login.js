import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { email, password });

      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);

      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'owner') {
        navigate('/owner-dashboard');
      } else {
        navigate('/');
      }

    } catch (error) {
      console.error('Login failed', error.response?.data?.message || error.message);
      alert('Login Failed!');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="container">
        <h2 className="text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right mb-3">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit">Login</button>
        </form>

        <div className="register-link">
          <p>Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
