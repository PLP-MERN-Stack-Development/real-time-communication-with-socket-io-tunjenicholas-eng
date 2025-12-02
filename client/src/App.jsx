// client/src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from './socket/socket';
import Login from './components/Login';
import './App.css';

function App() {
  const { 
    isConnected, 
    messages, 
    users, 
    typingUsers,
    connect, 
    joinRoom,
    leaveRoom,
    sendMessage, 
    setTyping 
  } = useSocket();

  const [username, setUsername] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [room, setRoom] = useState('general');
  
  // Auto-scroll to bottom of chat
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleJoin = (user) => {
    setUsername(user);
    connect(user); 
    setIsJoined(true);
    joinRoom('general'); // Automatically join general room
  };

  const handleRoomChange = (newRoom) => {
    leaveRoom(room);
    setRoom(newRoom);
    joinRoom(newRoom);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      sendMessage(currentMessage, room);
      setCurrentMessage('');
      setTyping(false, room);
    }
  };

  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    if (e.target.value.length > 0) {
      setTyping(true, room);
    } else {
      setTyping(false, room);
    }
  };

  // Stop typing indicator after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentMessage) setTyping(false, room);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentMessage, room]);

  if (!isJoined) {
    return <Login onJoin={handleJoin} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar: Users and Rooms */}
      <div className="sidebar">
        {/* CONNECTION STATUS DEBUGGER */}
        <div style={{ 
          padding: '8px', 
          marginBottom: '15px', 
          background: isConnected ? '#d4edda' : '#f8d7da', 
          color: isConnected ? '#155724' : '#721c24',
          borderRadius: '4px',
          fontSize: '0.85rem',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Status: {isConnected ? '● Connected' : '○ Disconnected'}
        </div>

        <h3>Active Room: {room}</h3>
        <div className="room-controls">
           <button 
             onClick={() => handleRoomChange('general')}
             style={{ fontWeight: room === 'general' ? 'bold' : 'normal' }}
           >
             # General
           </button>
           <button 
             onClick={() => handleRoomChange('tech')}
             style={{ fontWeight: room === 'tech' ? 'bold' : 'normal' }}
           >
             # Tech
           </button>
        </div>
        
        <h3>Online Users ({users.length})</h3>
        <ul>
          {users.map((u) => (
            <li key={u.id} style={{ color: u.username === username ? '#007bff' : 'inherit' }}>
              {u.username} {u.username === username && '(You)'}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area">
        <div className="messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
              Welcome to the #{room} channel. Start chatting!
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.sender === username ? 'my-message' : 'other-message'}`}>
              <strong>{msg.sender}</strong>
              <p>{msg.message}</p>
              <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="typing-indicator">
           {typingUsers.length > 0 && 
             `${typingUsers.filter(u => u.username !== username).map(u => u.username).join(', ')} is typing...`}
        </div>

        <form onSubmit={handleSend} className="input-area">
          <input
            type="text"
            value={currentMessage}
            onChange={handleTyping}
            placeholder={`Message #${room}...`}
          />
          <button type="submit" disabled={!isConnected || !currentMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;