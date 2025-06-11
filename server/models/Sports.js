const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },  // New field for storing image URL or path
}, { timestamps: true });

module.exports = mongoose.model('Sport', sportSchema);
