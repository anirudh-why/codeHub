const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const User = require('../models/User');
const File = require('../models/File');
const Folder = require('../models/Folder');
const { v4: uuidv4 } = require('uuid');

// Get user dashboard data
router.get('/dashboard/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }
    
    // Get all rooms where the user is a member
    const rooms = await Room.find({ 'users.email': userEmail });
    
    // Count files in each room
    const roomsWithStats = await Promise.all(rooms.map(async (room) => {
      const fileCount = await File.countDocuments({ room: room._id });
      const folderCount = await Folder.countDocuments({ room: room._id });
      
      // Find last active time
      let lastActive = room.updatedAt;
      if (room.messages && room.messages.length > 0) {
        const lastMessage = room.messages[room.messages.length - 1];
        if (lastMessage.timestamp > lastActive) {
          lastActive = lastMessage.timestamp;
        }
      }
      
      return {
        _id: room._id,
        name: room.name,
        language: room.language,
        link: room.link,
        fileCount,
        folderCount,
        userCount: room.users.length,
        createdAt: room.createdAt,
        lastActive,
        role: room.users.find(u => u.email === userEmail)?.role || 'viewer',
        createdBy: room.createdBy
      };
    }));
    
    // Sort by last active
    roomsWithStats.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
    
    res.json(roomsWithStats);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new workspace
router.post('/workspaces', async (req, res) => {
  try {
    const { name, language, userEmail, userName, userPhoto } = req.body;
    
    if (!name || !userEmail) {
      return res.status(400).json({ error: 'Name and user email are required' });
    }
    
    // Create a new room
    const room = new Room({
      name,
      language: language || 'javascript',
      createdBy: userEmail,
      link: uuidv4(),
      users: [{
        email: userEmail,
        displayName: userName || userEmail.split('@')[0],
        photoURL: userPhoto || null,
        role: 'admin',
        isActive: false,
        lastActive: new Date()
      }],
      code: '// Write your code here'
    });
    
    await room.save();
    
    // Create a default file
    const defaultFile = new File({
      name: 'main.' + (language === 'python' ? 'py' : language === 'java' ? 'java' : 'js'),
      content: '// Welcome to your new workspace',
      language: language || 'javascript',
      room: room._id,
      createdBy: userEmail
    });
    
    await defaultFile.save();
    
    res.status(201).json({
      message: 'Workspace created successfully',
      workspace: {
        _id: room._id,
        name: room.name,
        language: room.language,
        link: room.link,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a workspace
router.delete('/workspaces/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }
    
    // Find the room
    const room = await Room.findOne({ link: workspaceId });
    
    if (!room) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Check if user is the admin
    const userInRoom = room.users.find(u => u.email === userEmail);
    if (!userInRoom || userInRoom.role !== 'admin') {
      return res.status(403).json({ error: 'Only the admin can delete a workspace' });
    }
    
    // Delete all files and folders
    await File.deleteMany({ room: room._id });
    await Folder.deleteMany({ room: room._id });
    
    // Delete the room
    await Room.findByIdAndDelete(room._id);
    
    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave a workspace
router.post('/workspaces/:workspaceId/leave', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }
    
    // Find the room
    const room = await Room.findOne({ link: workspaceId });
    
    if (!room) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Check if user is in the room
    const userIndex = room.users.findIndex(u => u.email === userEmail);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found in workspace' });
    }
    
    // If user is the only admin, check if there are other users
    if (room.users[userIndex].role === 'admin') {
      const otherAdmins = room.users.filter(u => u.role === 'admin' && u.email !== userEmail);
      
      if (otherAdmins.length === 0 && room.users.length > 1) {
        // Promote another user to admin
        const nextUserIndex = userIndex === 0 ? 1 : 0;
        room.users[nextUserIndex].role = 'admin';
      } else if (otherAdmins.length === 0 && room.users.length === 1) {
        // User is the only one in the room, delete the room
        await File.deleteMany({ room: room._id });
        await Folder.deleteMany({ room: room._id });
        await Room.findByIdAndDelete(room._id);
        return res.json({ message: 'Workspace deleted as you were the last user' });
      }
    }
    
    // Remove user from room
    room.users.splice(userIndex, 1);
    await room.save();
    
    res.json({ message: 'Left workspace successfully' });
  } catch (error) {
    console.error('Error leaving workspace:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 