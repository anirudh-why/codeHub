const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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

// Room model
const Room = require('./models/Room');

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('joinRoom', async ({ roomId, username }) => {
    socket.join(roomId);
    socket.username = username;
    
    const users = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
      .map(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        return socket.username;
      });
    
    io.to(roomId).emit('updateUsers', users);
    
    const joinMessage = {
      username: 'System',
      message: `${username} has joined the room`,
      timestamp: new Date()
    };
    socket.to(roomId).emit('message', joinMessage);
  });

  socket.on('chatMessage', async ({ roomId, username, message }) => {
    const messageData = { username, message, timestamp: new Date() };
    io.to(roomId).emit('message', messageData);
    
    try {
      await Room.findOneAndUpdate(
        { link: roomId },
        { $push: { messages: messageData } }
      );
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('codeChange', async ({ roomId, code }) => {
    socket.to(roomId).emit('codeUpdate', code);
    
    try {
      await Room.findOneAndUpdate(
        { link: roomId },
        { code }
      );
    } catch (error) {
      console.error('Error saving code:', error);
    }
  });

  socket.on('disconnect', () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach(roomId => {
      const users = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .map(socketId => {
          const socket = io.sockets.sockets.get(socketId);
          return socket.username;
        });
      io.to(roomId).emit('updateUsers', users);
      
      const leaveMessage = {
        username: 'System',
        message: `${socket.username} has left the room`,
        timestamp: new Date()
      };
      io.to(roomId).emit('message', leaveMessage);
    });
    console.log('User disconnected');
  });
});

// Create Room Route
app.post('/api/rooms', async (req, res) => {
  const { name, language, createdBy } = req.body;
  try {
    const room = new Room({
      name,
      language,
      createdBy,
      link: uuidv4(),
    });
    await room.save();
    res.status(201).json({ message: 'Room created successfully', link: room.link });
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

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 