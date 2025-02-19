import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import { toast } from 'react-toastify';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';

function Room() {
  const { roomId } = useParams();
  const [code, setCode] = useState('// Write your code here');
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let newSocket = null;

    const initializeRoom = async () => {
      // Prompt for username when joining
      const name = prompt('Please enter your name:');
      setUsername(name || 'Anonymous');

      // Fetch existing room data
      try {
        const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`);
        const data = await response.json();
        if (response.ok) {
          setCode(data.code);
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Error fetching room data:', error);
      }

      // Initialize socket connection
      newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.emit('joinRoom', { roomId, username: name || 'Anonymous' });

      newSocket.on('codeUpdate', (updatedCode) => {
        setCode(updatedCode);
      });

      newSocket.on('message', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      newSocket.on('updateUsers', (updatedUsers) => {
        setUsers(updatedUsers);
      });

      setIsLoading(false);
    };

    initializeRoom();

    // Cleanup function
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [roomId]);

  const handleCodeChange = (value) => {
    setCode(value);
    socket?.emit('codeChange', { roomId, code: value });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      const newMessage = {
        username,
        message: message.trim(),
        timestamp: new Date()
      };
      socket.emit('chatMessage', { roomId, ...newMessage });
      setMessage('');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat and Users Section - Left Side */}
      <div className="w-80 flex flex-col bg-white border-r border-gray-200">
        {/* Users List */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold mb-2">Users in Room</h3>
          <ul className="space-y-1">
            {users.map((user, index) => (
              <li key={index} className="text-gray-700 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {user}
              </li>
            ))}
          </ul>
        </div>

        {/* Chat Box */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.username === username 
                    ? 'ml-auto bg-blue-500 text-white' 
                    : 'bg-gray-100'
                }`}
              >
                <div className="font-semibold text-sm">
                  {msg.username === username ? 'You' : msg.username}
                </div>
                <div>{msg.message}</div>
                <div className="text-xs opacity-75">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Code Editor - Right Side */}
      <div className="flex-1">
        <Editor
          height="100vh"
          defaultLanguage="javascript"
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
}

export default Room; 