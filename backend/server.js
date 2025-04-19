const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const User = require('./models/User');
const ioUtil = require('./utils/io');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize Socket.IO utility
ioUtil.init(io);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Import models
const Room = require('./models/Room');
const File = require('./models/File');
const Folder = require('./models/Folder');

// Track active users and connections
const connectedUsers = {};

// Track active users in each room
const activeUsers = new Map(); // roomId => Set of socket IDs

// Import routes
const apiRoutes = require('./routes/api');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Register routes
app.use('/api', apiRoutes);
app.use('/api', dashboardRoutes);

// Handle socket connections
io.on('connection', (socket) => {
  let currentRoomId = null;
  let userInfo = null;

  // Join a room
  socket.on('joinRoom', async ({ roomId, user }) => {
    try {
      currentRoomId = roomId;
      userInfo = user;
      
      // Leave any previous rooms
      const previousRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
      previousRooms.forEach(room => {
        socket.leave(room);
      });
      
      // Join the new room
      socket.join(roomId);
      
      // Get room data to retrieve user's role
      const room = await Room.findById(roomId);
      if (room) {
        // Find user's role in the room
        const roomUser = room.users.find(u => u.email === user.email);
        const userRole = roomUser ? roomUser.role : 'viewer';
        
        // Store user information
        connectedUsers[socket.id] = {
          socketId: socket.id,
          userId: socket.id,
          roomId,
          role: userRole,
          ...user
        };
        
        console.log(`User ${user.email} joined room ${roomId} with role ${userRole}`);
        
        // Get active users in this room
        const roomUsers = Object.values(connectedUsers).filter(u => u.roomId === roomId);
        
        // Emit active users to everyone in the room
        io.to(roomId).emit('activeUsers', roomUsers);
        
        // Emit room data to this user
        socket.emit('roomData', room);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // Handle code changes
  socket.on('codeChange', async ({ roomId, code, userRole }) => {
    try {
      // Broadcast the code change to everyone else in the room
      socket.to(roomId).emit('codeUpdate', code);
      
      // Update the code in the database if user is admin or editor
      if (userRole === 'admin' || userRole === 'editor') {
        await Room.findByIdAndUpdate(roomId, { code });
      }
    } catch (error) {
      console.error('Error updating code:', error);
    }
  });

  // Handle cursor position updates
  socket.on('cursorPosition', ({ roomId, position }) => {
    if (!userInfo) return;
    
    socket.to(roomId).emit('remoteCursor', {
      userId: socket.id,
      position,
      user: userInfo
    });
  });

  // Handle chat messages
  socket.on('chatMessage', async ({ roomId, message }) => {
    try {
      if (!userInfo) return;
      
      const messageData = {
        username: userInfo.displayName || userInfo.email,
        message,
        timestamp: new Date()
      };
      
      // Broadcast the message to everyone in the room
      io.to(roomId).emit('message', messageData);
      
      // Store the message in the database
      await Room.findByIdAndUpdate(roomId, {
        $push: { messages: messageData }
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle file updates
  socket.on('fileUpdate', async ({ roomId, fileId, content }) => {
    try {
      if (!userInfo) return;
      
      // Update file in database
      await File.findByIdAndUpdate(fileId, { 
        content, 
        updatedAt: Date.now() 
      });
      
      // Broadcast the file update to everyone else in the room
      socket.to(roomId).emit('fileContentUpdate', { fileId, content });
    } catch (error) {
      console.error('Error updating file:', error);
    }
  });

  // Handle file/folder structure changes
  socket.on('fileStructureChange', async ({ roomId }) => {
    try {
      // Get updated file structure
      const files = await File.find({ room: roomId });
      const folders = await Folder.find({ room: roomId });
      
      // Build file tree
      const fileTree = buildFileTree(files, folders);
      
      // Broadcast the updated file structure to everyone in the room
      io.to(roomId).emit('fileStructureUpdate', fileTree);
    } catch (error) {
      console.error('Error updating file structure:', error);
    }
  });

  // Handle user role changes
  socket.on('changeUserRole', async ({ roomId, email, newRole }) => {
    try {
      console.log(`Changing role for user ${email} to ${newRole} in room ${roomId}`);
      
      // Update user role in database
      const room = await Room.findById(roomId);
      
      if (room) {
        const userIndex = room.users.findIndex(u => u.email === email);
        
        if (userIndex !== -1) {
          room.users[userIndex].role = newRole;
          await room.save();
          
          console.log(`User role updated in database. Broadcasting to room`);
          
          // Broadcast updated room data to everyone in the room
          io.to(roomId).emit('roomData', room);
          
          // Update connected users data if the user is online
          const connectedSocketIds = Object.keys(connectedUsers);
          for (const socketId of connectedSocketIds) {
            if (connectedUsers[socketId].email === email && connectedUsers[socketId].roomId === roomId) {
              connectedUsers[socketId].role = newRole;
            }
          }
          
          // Emit updated active users
          const roomUsers = Object.values(connectedUsers).filter(u => u.roomId === roomId);
          io.to(roomId).emit('activeUsers', roomUsers);
        }
      }
    } catch (error) {
      console.error('Error changing user role:', error);
    }
  });

  // Handle user typing
  socket.on('typing', ({ roomId, userId, username }) => {
    if (!userInfo) return;
    
    socket.to(roomId).emit('userTyping', {
      userId: userId || socket.id,
      username: username || userInfo.displayName || userInfo.email
    });
  });
  
  // Handle user stopped typing
  socket.on('stoppedTyping', ({ roomId, userId }) => {
    if (!userInfo) return;
    
    socket.to(roomId).emit('userStoppedTyping', {
      userId: userId || socket.id
    });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    if (currentRoomId && connectedUsers[socket.id]) {
      // Remove user from connected users
      delete connectedUsers[socket.id];
      
      // Emit updated active users list to the room
      const roomUsers = Object.values(connectedUsers).filter(u => u.roomId === currentRoomId);
      io.to(currentRoomId).emit('activeUsers', roomUsers);
    }
  });
});

// Helper function to build file tree (copy from API routes)
function buildFileTree(files, folders) {
  // Create a map of all folders by ID
  const folderMap = {};
  folders.forEach(folder => {
    folderMap[folder._id] = {
      _id: folder._id,
      name: folder.name,
      type: 'folder',
      parent: folder.parent,
      children: []
    };
  });
  
  // Add files to their parent folders
  files.forEach(file => {
    const fileObj = {
      _id: file._id,
      name: file.name,
      type: 'file',
      parent: file.parent,
      language: file.language
    };
    
    if (file.parent && folderMap[file.parent]) {
      folderMap[file.parent].children.push(fileObj);
    }
  });
  
  // Add folders to their parent folders
  folders.forEach(folder => {
    if (folder.parent && folderMap[folder.parent]) {
      folderMap[folder.parent].children.push(folderMap[folder._id]);
    }
  });
  
  // Get root items (no parent)
  const rootItems = [
    ...files.filter(file => !file.parent).map(file => ({
      _id: file._id,
      name: file.name,
      type: 'file',
      language: file.language
    })),
    ...folders.filter(folder => !folder.parent).map(folder => folderMap[folder._id])
  ];
  
  // Sort items: folders first, then files, both alphabetically
  rootItems.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  // Sort children of all folders the same way
  Object.values(folderMap).forEach(folder => {
    folder.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  });
  
  return rootItems;
}

// Create Room Route
app.post('/api/rooms', async (req, res) => {
  const { name, language, createdBy, creatorName, creatorPhoto } = req.body;
  try {
    const room = new Room({
      name,
      language,
      createdBy,
      link: uuidv4(),
      users: [{
        email: createdBy,
        displayName: creatorName,
        photoURL: creatorPhoto,
        role: 'admin',
        isActive: false
      }]
    });
    await room.save();
    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(400).json({ error: 'Error creating room' });
  }
});

// Get room data
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ link: req.params.roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users by email pattern
app.get('/api/users/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 3) {
    return res.status(400).json({ error: 'Search query must be at least 3 characters' });
  }
  
  try {
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    
    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'No users found matching the query',
        users: []
      });
    }
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Server error while searching users' });
  }
});

// Add user to room
app.post('/api/rooms/:roomId/addUser', async (req, res) => {
  const { roomId } = req.params;
  const { email, role, displayName, photoURL } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be admin, editor, or viewer' });
  }
  
  try {
    // Check if room exists
    const room = await Room.findOne({ link: roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Check if user exists in database
    let user = await User.findOne({ email });
    if (!user && email) {
      // Create a placeholder user if not found
      user = new User({
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || null,
        lastLogin: new Date()
      });
      await user.save();
    }
    
    // Check if user already exists in room
    const userExists = room.users.some(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ error: 'User already exists in this room' });
    }
    
    // Add user to room
    await Room.updateOne(
      { link: roomId },
      {
        $push: {
          users: {
            email,
            displayName: displayName || (user ? user.displayName : email.split('@')[0]),
            photoURL: photoURL || (user ? user.photoURL : null),
            role: role || 'viewer',
            isActive: false
          }
        }
      }
    );
    
    // Get updated room data
    const updatedRoom = await Room.findOne({ link: roomId });
    
    res.json(updatedRoom);
  } catch (error) {
    console.error('Error adding user to room:', error);
    res.status(500).json({ error: 'Server error while adding user to room' });
  }
});

// Get rooms where user is a member
app.get('/api/users/:email/rooms', async (req, res) => {
  const { email } = req.params;
  
  try {
    const rooms = await Room.find({
      "users.email": email
    });
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update user
app.post('/api/users', async (req, res) => {
  const { email, displayName, photoURL } = req.body;
  
  try {
    // Try to find existing user
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user's last login
      user = await User.findOneAndUpdate(
        { email },
        { 
          lastLogin: new Date(),
          displayName: displayName || user.displayName,
          photoURL: photoURL || user.photoURL
        },
        { new: true }
      );
    } else {
      // Create new user
      user = new User({
        email,
        displayName,
        photoURL,
        lastLogin: new Date()
      });
      await user.save();
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error managing user:', error);
    res.status(500).json({ error: 'Error managing user' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 