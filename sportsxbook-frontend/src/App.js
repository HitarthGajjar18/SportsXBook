import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AddFacility from './components/AddFacility';
import FacilitiesPage from './pages/FacilitiesPage';
import Facilities from './pages/Facilities';
import FacilityDetails from './pages/FacilityDetails';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Footer from './components/Footer';
import About from './pages/About';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/facilities" element={<FacilitiesPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/facility" element={<Facilities />} />
        <Route path="/facility-detail/:facilityId" element={<FacilityDetails />} />
        <Route path="/book/:facilityId/:sport" element={<Booking />} />
        <Route path="/owner/add-facility" element={<AddFacility />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/about" element={<About />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route 
          path="/owner-dashboard" 
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
