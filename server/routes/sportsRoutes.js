const express = require('express');
const multer = require('multer');
const path = require('path');
const Sport = require('../models/Sports');  // Assuming you have the Sport model
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');  // Auth middleware

const router = express.Router();

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Path where images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Unique file name based on timestamp
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage });

// Admin route to add a sport (image included)
router.post('/add-sport', authenticateUser, authorizeRoles('admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if the required fields are provided
    if (!name || !description || !req.file) {
      return res.status(400).json({ msg: 'Name, Description, and Image are required' });
    }

    // Check if the sport already exists
    const existingSport = await Sport.findOne({ name });
    if (existingSport) {
      return res.status(400).json({ msg: 'Sport already exists' });
    }

    // Construct the image URL (use relative path for local storage)
    const imageUrl = `/uploads/${req.file.filename}`;  // This is the path that will be stored in the database

    // Create a new sport entry in the database
    const newSport = new Sport({
      name,
      description,
      image: imageUrl  // Save the image URL
    });

    // Save the new sport
    await newSport.save();

    res.status(201).json({ msg: 'Sport added successfully', sport: newSport });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/sport', async (req, res) => {
    try {
      const sports = await Sport.find();
      res.status(200).json(sports);
    } catch (err) {
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  });

// DELETE sport
router.delete('/delete-sport/:id', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const sport = await Sport.findByIdAndDelete(req.params.id);
    if (!sport) return res.status(404).json({ message: 'Sport not found' });
    res.json({ message: 'Sport deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT (edit) sport
router.put('/update-sport/:id', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedSport = await Sport.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!updatedSport) return res.status(404).json({ message: 'Sport not found' });
    res.json(updatedSport);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
