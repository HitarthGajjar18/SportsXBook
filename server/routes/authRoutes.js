const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');
const { login } = require('../controllers/authController');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // very important


router.post('/login', login);
router.post('/register', register);

router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  
      const resetLink = `http://localhost:3000/reset-password/${token}`;
  
      // Use nodemailer to send the email
      const transporter = nodemailer.createTransport({
        service: 'gmail', // or 'hotmail', 'yahoo', etc.
        auth: {
          user: process.env.EMAIL_USER, // your email address
          pass: process.env.EMAIL_PASS  // your app password
        }
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset',
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Link valid for 15 minutes.</p>`
      };
  
      await transporter.sendMail(mailOptions);
  
      res.json({ message: 'Reset link sent to your email' });
    } catch (error) {
      console.error('Forgot Password Error:', error);  // <--- See actual error
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

  router.post('/reset-password/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
  
      // 1. Verify the token using your JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // 2. Find the user by decoded ID
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // 3. Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // 4. Save the new password
      user.password = hashedPassword;
      await user.save();
  
      // 5. Respond with success
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset Password Error:', error.message);
      res.status(400).json({ message: 'Invalid or expired token' });
    }
  });
  

module.exports = router;

