const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  photoURL: {
    type: String
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    editorFontSize: {
      type: Number,
      default: 14
    },
    tabSize: {
      type: Number,
      default: 2
    }
  }
});

module.exports = mongoose.model('User', UserSchema); 