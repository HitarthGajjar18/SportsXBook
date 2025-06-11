## 🏆 SportsXBook – Sports Management System
SportsXBook is a full-stack sports management web application built using the MERN stack (MongoDB, Express.js, React, Node.js). It provides an efficient platform for users to book sports slots, manage bookings, and for admins and owners to monitor and control various aspects of the system.

## 📌 Features
✅ User Authentication & Authorization
Secure registration and login with role-based access for:

Admin
Owner
User

## 🛒 Cart System
Users can add sports facilities or slots to the cart before confirming their booking.

## 🕒 Time Management & Slot Booking
Book slots based on available time and dates dynamically chosen by the user.

## 👥 Three Role Modules

Admin – Manage users, owners, and system settings.
Owner – Manage facility listings, slots, bookings, and track revenue.
User – Browse, select, and book sports slots.

## 🧱 Tech Stack (MERN)
Frontend: React, Redux Toolkit (if used), Axios, Tailwind CSS / Bootstrap

Backend: Node.js, Express.js
Database: MongoDB (Mongoose ODM)
Authentication: JWT, Bcrypt.js
Other Tools:
Postman (for API testing)
Cloudinary or Firebase (for image uploads) (if used)
Dotenv for environment configuration

## 🛡️ Role-Based Access Control

Role	      Permissions
Admin	      Manage all users, owners, and settings
Owner	      Add/manage facilities, view bookings
User	      Browse & book slots, manage cart

### Installation

```bash
🚀 Getting Started
1. Clone the Repository

    git clone https://github.com/your-username/sportsxbook.git

    cd sportsxbook

3. Install Dependencies

    Backend
    
        cd backend
        npm install

    Frontend
    
        cd frontend
        npm install

4. Environment Setup

    Create a .env file in the backend folder and configure the following:
    
        PORT=5000
        MONGO_URI=your_mongo_connection_string
        JWT_SECRET=your_jwt_secret

5. Run the Project

    Backend
      npm start
    
    Frontend
      npm start

🧪 API Endpoints
You can document a few key routes here or link to a Postman collection if available.

POST /api/auth/register – Register user
POST /api/auth/login – Login user
GET /api/slots – Get available slots
POST /api/book – Book slot
GET /api/admin/users – List all users (Admin)\
GET /api/owner/bookings – Owner's booking summary

📁 Folder Structure

sportsxbook/
│
├── server/        # Express server, models, controllers, routes
├── sportsxbook-frontend/       # React app with pages, components, context/api
├── .env
└── README.md

