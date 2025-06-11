require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // ⭐️ ADD THIS

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ⭐️ MAKE SURE uploads folder is served statically
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Simple Route
app.get('/', (req, res) => {
  res.send('SportsXBook API is running');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
  });

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api', authRoutes);

const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const facilityRoutes = require('./routes/facilityRoutes');
app.use('/api/facilities', facilityRoutes);

const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

const sportsRoutes = require('./routes/sportsRoutes');
app.use('/api/sports', sportsRoutes);
