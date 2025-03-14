const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: String,
    required: true
  },
  code: {
    type: String,
    default: '// Write your code here'
  },
  messages: [{
    username: String,
    message: String,
    timestamp: Date
  }],
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

module.exports = mongoose.model('Room', roomSchema); 