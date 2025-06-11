const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facility: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  sportId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Sport' },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  duration: { type: Number, required: true },
  numberOfResources: { type: Number, required: true },
  numberOfPeople: { type: Number, required: true },
  paymentMode: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;