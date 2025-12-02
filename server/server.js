// server.js - Main server file for Socket.io chat application
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     methods: ['GET', 'POST'],
//     credentials: true,
//   },
// });

const io = new Server(server, {
  cors: {
    origin: "*", // ALLOW ANY URL (Fixes CORS blocking)
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and messages
// In a real app, use a database (MongoDB/PostgreSQL)
const users = {}; 
const messages = []; 
const typingUsers = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Handle user joining
  socket.on('user_join', (username) => {
    users[socket.id] = { username, id: socket.id };
    
    // Send updated user list to everyone
    io.emit('user_list', Object.values(users));
    
    // Notify others
    socket.broadcast.emit('user_joined', { username, id: socket.id });
    console.log(`${username} joined the chat`);
  });

  // 2. Handle Joining Specific Rooms (Advanced Feature)
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
    
    // Optional: Notify room
    socket.to(room).emit('receive_message', {
      id: Date.now(),
      sender: 'System',
      message: `${users[socket.id]?.username || 'User'} joined the room.`,
      timestamp: new Date().toISOString(),
      room: room,
      isSystem: true
    });
  });

  // 3. Handle Leaving Rooms
  socket.on('leave_room', (room) => {
    socket.leave(room);
    console.log(`User ${socket.id} left room: ${room}`);
  });

  // 4. Handle Chat Messages (Global or Room-based)
  socket.on('send_message', (messageData) => {
    const { message, room } = messageData;
    
    const msgObject = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      room: room || 'general', // Default to general if no room
    };
    
    // Store message (Limit history to 100)
    messages.push(msgObject);
    if (messages.length > 100) {
      messages.shift();
    }
    
    // If a room is specified, emit only to that room
    if (room) {
      io.to(room).emit('receive_message', msgObject);
    } else {
      // Otherwise emit to everyone (Global Chat)
      io.emit('receive_message', msgObject);
    }
  });

  // 5. Handle Typing Indicator
  socket.on('typing', ({ isTyping, room }) => {
    if (users[socket.id]) {
      const username = users[socket.id].username;
      
      // Update local typing state
      if (isTyping) {
        typingUsers[socket.id] = { username, room };
      } else {
        delete typingUsers[socket.id];
      }
      
      // Broadcast typing status
      if (room) {
        // Send only to room members
        socket.to(room).emit('typing_users', Object.values(typingUsers).filter(u => u.room === room));
      } else {
        // Global broadcast
        io.emit('typing_users', Object.values(typingUsers));
      }
    }
  });

  // 6. Handle Private Messages
  socket.on('private_message', ({ to, message }) => {
    const messageData = {
      id: Date.now(),
      sender: users[socket.id]?.username || 'Anonymous',
      senderId: socket.id,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };
    
    // Send to specific socket ID
    io.to(to).emit('private_message', messageData);
    // Send back to sender so they see it too
    socket.emit('private_message', messageData);
  });

  // 7. Handle Disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const { username } = users[socket.id];
      io.emit('user_left', { username, id: socket.id });
      console.log(`${username} left the chat`);
    }
    
    delete users[socket.id];
    delete typingUsers[socket.id];
    
    io.emit('user_list', Object.values(users));
    io.emit('typing_users', Object.values(typingUsers));
  });
});

// API Routes
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };