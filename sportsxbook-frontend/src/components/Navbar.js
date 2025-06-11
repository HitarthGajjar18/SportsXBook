import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; // Import the custom CSS file

const Navigation = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="logo">
        <span className="logo-white">Sports</span>
        <span className="logo-blue">XBook</span>
      </Link>

      {/* Links */}
      <div className="nav-links">

        {/* Always visible */}
        <Link to="/">Home</Link>
        <Link to="/facility">Facilities</Link>
        <Link to="/about">About Us</Link>

        {/* Conditionally render based on login and role */}
        {!token && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}

        {token && role === 'user' && (
          <>
            <Link to="/my-bookings">My Bookings</Link>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        )}

        {token && role === 'owner' && (
          <>
            <Link to="/owner-dashboard">Owner Dashboard</Link>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        )}

        {token && role === 'admin' && (
          <>
            <Link to="/admin-dashboard">Admin Dashboard</Link>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        )}

      </div>
    </nav>
  );
};

export default Navigation;
