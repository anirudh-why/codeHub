import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Editor from '@monaco-editor/react';

function CreateRoom() {
  const [roomName, setRoomName] = useState('');
  const [roomLink, setRoomLink] = useState('');
  const [code, setCode] = useState('// Write your code here');
  const [showEditor, setShowEditor] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName }),
      });
      const data = await response.json();
      
      if (response.ok) {
        setRoomLink(`${window.location.origin}/room/${data.link}`);
        setShowEditor(true);
        toast.success('Room created successfully!');
        navigate(`/room/${data.link}`);
      } else {
        toast.error(data.error || 'Error creating room');
      }
    } catch (error) {
      toast.error('Failed to create room');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {!showEditor ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Create a New Room</h2>
          <div className="space-y-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter Room Name"
              className="w-full p-2 border rounded"
              required
            />
            <button
              onClick={handleCreateRoom}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create Room
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Share this link with others:</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={roomLink}
                readOnly
                className="w-full p-2 border rounded bg-gray-50"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomLink);
                  toast.success('Link copied to clipboard!');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <Editor
              height="500px"
              defaultLanguage="javascript"
              value={code}
              onChange={setCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateRoom; 