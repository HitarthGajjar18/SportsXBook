const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Facility = require('../models/Facility')
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// Fetch all users by role (user or owner)
router.get('/users', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    if (!role || !['user', 'owner'].includes(role)) {
      return res.status(400).json({ message: 'Invalid or missing role parameter' });
    }

    const users = await User.find({ role }).select('-password'); // Hide password
    res.json(users);
  } catch (err) {
    console.error('Error fetching users by role:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE a user
router.delete('/delete-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// DELETE an owner and their facilities
router.delete('/delete-owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;

    // Step 1: Delete all facilities by this owner
    await Facility.deleteMany({ ownerId });

    // Step 2: Delete the owner (assuming stored in User model)
    await User.findByIdAndDelete(ownerId);

    res.status(200).json({ message: 'Owner and their facilities deleted successfully' });
  } catch (err) {
    console.error('Error deleting owner:', err);
    res.status(500).json({ error: 'Failed to delete owner and their facilities' });
  }
});

module.exports = router;
