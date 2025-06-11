const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, address, dateOfBirth, role } = req.body;

    // Validate fields
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ msg: 'All required fields must be filled' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      address,
      dateOfBirth,
      role: role === 'admin' ? 'admin' : role // Only allow admin if explicitly set
    });

    await user.save();

    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter both email and password' });
      }
  
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
  
      // Create JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      // Send token and user info (excluding password)
      const { password: _, ...userData } = user._doc;
  
      res.json({ token, user: userData });
  
    } catch (err) {
      res.status(500).json({ msg: 'Server error', error: err.message });
    }
  };
  
  module.exports = { register, login };

