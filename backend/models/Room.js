const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  link: { type: String, unique: true },
  code: { type: String, default: '// Write your code here' },
  messages: [{
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Room', roomSchema); 