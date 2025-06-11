// models/Facility.js
const mongoose = require('mongoose');
const Sport = require('./Sports');  // Import Sport model to reference it

// Sport schema - now includes specific attributes for each sport
const sportSchema = new mongoose.Schema({
  sportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport', required: true }, // Reference to Sport model
  noOfResources: { type: Number, required: true }, // Number of resources available for this sport in the facility
  maxPeoplePerUnit: { type: Number, required: true }, // Maximum people per resource/unit
  operatingHours: {
    days: { type: String, enum: ['Mon-Fri', 'Sat-Sun', 'All Days'], required: true },
    opening: { type: String, required: true },
    closing: { type: String, required: true }
  },
  price: { type: Number, required: true } // Price for using this sport in the facility
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, { timestamps: true });

const facilitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  description: String,
  photo: [String],
  amenities: [String],
  contactNumber: { type: String, required: true },
  sports: [sportSchema], // Embed the sport schema with the required details
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Facility', facilitySchema);
