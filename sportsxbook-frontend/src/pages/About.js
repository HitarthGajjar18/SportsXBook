// About.js
import React from 'react';
import './About.css';
import henilImg from '../assets/henil.jpg';
import hitarthImg from '../assets/hitarth.jpg';
import ronakImg from '../assets/ronak.jpg';
import { FaInstagram } from 'react-icons/fa'; 


const About = () => {
  return (
    <div className="about-page">
      <section className="about-header">
        <h1>About <span className="white">Sports</span><span className="blue">XBook</span></h1>
        <p>
          The leading sports facility booking platform in India, connecting players with premier venues for pool, bowling, and pickleball.
        </p>
      </section>

      <section className="story">
        <h2>Our Story</h2>
        <p>
          SportsXBook started in 2023 with a simple mission: make booking sports facilities as easy as ordering food online.
          Founded by a team of sports enthusiasts, we realized how difficult it was to find and book quality venues for recreational sports.
        </p>
        <p>
          What began as a small platform for booking pool tables has now grown into India's premier booking service for multiple sports facilities,
          including bowling alleys and pickleball courts.
        </p>
        <p>
          Today, we connect thousands of players with the best facilities across the country, making sports more accessible for everyone.
        </p>
      </section>

      <section className="choose">
        <h2>Why Choose <span className="white">Sports</span><span className="blue">XBook</span></h2>
        <p>We’re dedicated to providing the best booking experience for both players and facility owners.</p>

        <div className="features">
          <div className="feature-card">
            <h3>🏟 Premium Facilities</h3>
            <p>We partner with the highest quality venues to ensure a great experience every time.</p>
          </div>
          <div className="feature-card">
            <h3>⚡ Easy Booking</h3>
            <p>Our platform makes finding and booking sports facilities quick and hassle-free.</p>
          </div>
          <div className="feature-card">
            <h3>🤝 Community</h3>
            <p>Join a growing community of sports enthusiasts across India.</p>
          </div>
          <div className="feature-card">
            <h3>📞 Support</h3>
            <p>Our dedicated team is available to assist both users and facility owners.</p>
          </div>
        </div>
      </section>

      <section className="team">
        <h2>Our Team</h2>
        <p>Meet the passionate team behind <span className="white">Sports</span><span className="blue">XBook</span>.</p>
        <div className="team-members">
          <div className="team-member">
            <img src={henilImg} alt="Henil Suthar" />
            <h4>Henil Suthar</h4>
            <div className="social-icons">
                <a href="https://instagram.com/henil___33" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
                </a>
            </div>
          </div>
          <div className="team-member">
            <img src={hitarthImg} alt="Hitarth Gajjar" />
            <h4>Hitarth Gajjar</h4>
            <div className="social-icons">
                <a href="https://instagram.com/hitarth.gajjar" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
                </a>
            </div>
          </div>
          <div className="team-member">
            <img src={ronakImg} alt="Ronak Joshi" />
            <h4>Ronak Joshi</h4>
            <div className="social-icons">
                <a href="https://instagram.com/ronak__joshi18" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
                </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
