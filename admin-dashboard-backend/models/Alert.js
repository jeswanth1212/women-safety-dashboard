const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  name: String,
  phone: String,
  location: {
    latitude: Number,
    longitude: Number
  },
  message: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema); 