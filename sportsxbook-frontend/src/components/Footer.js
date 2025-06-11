// Footer.js
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h3 className="footer-logo">
          <span className="white">Sports</span><span className="blue">XBook</span>
        </h3>
        <p>Your trusted platform for booking sports facilities.</p>
        <div className="footer-links">
          <a href="/about">About</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/contact">Contact</a>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} SportsXBook. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
