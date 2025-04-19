const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    default: 'javascript'
  },
  code: {
    type: String,
    default: '// Write your code here'
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  users: [
    {
      email: {
        type: String,
        required: true
      },
      displayName: String,
      photoURL: String,
      role: {
        type: String,
        enum: ['admin', 'editor', 'viewer'],
        default: 'viewer'
      },
      isActive: {
        type: Boolean,
        default: false
      },
      lastActive: {
        type: Date,
        default: Date.now
      }
    }
  ],
  messages: [
    {
      username: String,
      message: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

// Update the updatedAt timestamp before saving
RoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Room', RoomSchema); 