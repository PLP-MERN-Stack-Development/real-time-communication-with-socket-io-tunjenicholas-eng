import React, { useState, useEffect } from 'react';
import { useSocket } from './socket'; // Your provided file
import Login from './components/Login';

function App() {
  const { 
    isConnected, 
    messages, 
    users, 
    typingUsers,
    connect, 
    sendMessage, 
    setTyping 
  } = useSocket();

  const [username, setUsername] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = (user) => {
    setUsername(user);
    connect(user); // Connects to socket
    setIsJoined(true);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      sendMessage(currentMessage);
      setCurrentMessage('');
      setTyping(false);
    }
  };

  // Handle Typing Indicator
  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    if (e.target.value.length > 0) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  // Stop typing indicator after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentMessage) setTyping(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentMessage]);

  if (!isJoined) {
    return <Login onJoin={handleJoin} />;
  }

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar: User List */}
      <div className="sidebar" style={{ width: '250px', borderRight: '1px solid #ccc', padding: '20px' }}>
        <h3>Online Users ({users.length})</h3>
        <ul>
          {users.map((u) => (
            <li key={u.id} style={{ color: u.username === username ? 'green' : 'black' }}>
              {u.username} {u.username === username && '(You)'}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Chat Area */}
      <div className="chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Messages List */}
        <div className="messages" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ 
              marginBottom: '10px', 
              textAlign: msg.sender === username ? 'right' : 'left' 
            }}>
              <div style={{ 
                display: 'inline-block', 
                background: msg.sender === username ? '#007bff' : '#f1f0f0',
                color: msg.sender === username ? 'white' : 'black',
                padding: '10px', 
                borderRadius: '10px'
              }}>
                <strong>{msg.sender}: </strong> {msg.message}
                <div style={{ fontSize: '0.8em', opacity: 0.7 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
        </div>

        {/* Typing Indicator */}
        <div style={{ height: '20px', padding: '0 20px', fontStyle: 'italic', color: 'gray' }}>
           {typingUsers.length > 0 && 
             `${typingUsers.filter(u => u !== username).join(', ')} is typing...`}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{ padding: '20px', borderTop: '1px solid #ccc' }}>
          <input
            type="text"
            value={currentMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            style={{ width: '80%', padding: '10px' }}
          />
          <button type="submit" style={{ width: '15%', marginLeft: '2%' }}>Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;