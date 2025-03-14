import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import io from 'socket.io-client';

function CodeEditor() {
  const { roomId } = useParams();
  const [code, setCode] = useState('// Write your code here');
  const [socket, setSocket] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const editorRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    setShareLink(`${window.location.origin}/editor/${roomId}`);

    newSocket.emit('joinRoom', { roomId });

    newSocket.on('codeChange', (updatedCode) => {
      setCode(updatedCode);
    });

    newSocket.on('cursorMove', (cursor) => {
      // Implement cursor tracking
    });

    newSocket.on('userJoined', (user) => {
      setCollaborators(prev => [...prev, user]);
    });

    newSocket.on('userLeft', (userId) => {
      setCollaborators(prev => prev.filter(u => u.id !== userId));
    });

    return () => newSocket.disconnect();
  }, [roomId]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // Add cursor decorations
    monaco.editor.defineTheme('myTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {}
    });
  };

  const handleCodeChange = (value) => {
    setCode(value);
    socket?.emit('codeChange', { roomId, code: value });
  };

  const handleCursorMove = (event) => {
    socket?.emit('cursorMove', {
      roomId,
      position: event.position,
      userId: socket.id
    });
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      setIsVideoCall(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket?.emit('chatMessage', { roomId, message: newMessage });
      setChatMessages(prev => [...prev, { text: newMessage, sender: 'You' }]);
      setNewMessage('');
    }
  };

  return (
    <div className="flex h-screen">
      {/* Editor Section */}
      <div className="flex-1">
        <div className="h-full">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true
            }}
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-800 text-white flex flex-col">
        {/* Collaborators */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold mb-2">Collaborators</h3>
          <div className="flex flex-wrap gap-2">
            {collaborators.map(user => (
              <div key={user.id} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Video Call */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={startVideoCall}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {isVideoCall ? 'End Call' : 'Start Video Call'}
          </button>
          {isVideoCall && (
            <div className="mt-2">
              <video ref={videoRef} autoPlay muted className="w-full rounded" />
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 overflow-y-auto mb-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className="mb-2">
                <span className="font-bold">{msg.sender}:</span> {msg.text}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-2 py-1 rounded bg-gray-700"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="px-4 py-1 bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Send
            </button>
          </form>
        </div>

        {/* Share Link */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-2 py-1 rounded bg-gray-700"
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareLink)}
              className="px-4 py-1 bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor; 