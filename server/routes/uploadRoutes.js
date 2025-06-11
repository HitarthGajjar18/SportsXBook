const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { authenticateUser } = require('../middleware/authMiddleware');

// @route   POST /api/upload
// @desc    Upload facility image
// @access  Private (Owner)
router.post('/', authenticateUser, upload.single('image'), (req, res) => {
  try {
    res.status(200).json({ imagePath: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Error uploading image:', error.message);
    res.status(500).json({ msg: 'Server error during upload' });
  }
});

module.exports = router;
