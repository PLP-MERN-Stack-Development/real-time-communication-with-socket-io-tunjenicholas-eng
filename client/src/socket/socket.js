// socket.js - Socket.io client setup
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Socket.io connection URL
// Ensure VITE_SOCKET_URL is set in your .env file, or it defaults to localhost
// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// HARDCODED to ensure it hits the running server
const SOCKET_URL = 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  // 1. Connect to socket server
  const connect = (username) => {
    socket.connect();
    if (username) {
      socket.emit('user_join', username);
      
      // Request Notification Permission on join
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }
  };

  // 2. Disconnect
  const disconnect = () => {
    socket.disconnect();
  };

  // 3. Join/Leave Rooms (Advanced Feature)
  const joinRoom = (room) => {
    socket.emit('join_room', room);
    // Clear messages when switching rooms if desired, or handle in UI
    setMessages([]); 
  };

  const leaveRoom = (room) => {
    socket.emit('leave_room', room);
  };

  // 4. Send Message (supports rooms)
  const sendMessage = (message, room = null) => {
    socket.emit('send_message', { message, room });
  };

  // 5. Send Private Message
  const sendPrivateMessage = (to, message) => {
    socket.emit('private_message', { to, message });
  };

  // 6. Set Typing Status
  const setTyping = (isTyping, room = null) => {
    socket.emit('typing', { isTyping, room });
  };

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);

      // BROWSER NOTIFICATION LOGIC
      // If the document is hidden (user is on another tab), send a notification
      if (document.hidden && Notification.permission === "granted") {
        new Notification("New Message", {
          body: `${message.sender}: ${message.message}`,
          icon: '/vite.svg' 
        });
      }
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
      
      // Notify for private messages too
      if (document.hidden && Notification.permission === "granted") {
        new Notification(`Private from ${message.sender}`, {
          body: message.message,
        });
      }
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    const onUserLeft = (user) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${user.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
    };
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    users,
    typingUsers,
    connect,
    disconnect,
    joinRoom,      
    leaveRoom,     
    sendMessage,
    sendPrivateMessage,
    setTyping,
  };
};

export default socket;