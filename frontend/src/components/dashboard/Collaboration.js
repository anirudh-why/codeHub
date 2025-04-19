import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Collaboration() {
  const [sessionCode, setSessionCode] = useState('');
  const navigate = useNavigate();

  const handleJoinSession = () => {
    if (sessionCode.trim()) {
      navigate(`/editor/${sessionCode}`);
    }
  };

  return (
    <div className="absolute inset-0 pt-6 pl-6 pr-6 flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-8">
        <h1 className="text-3xl text-white font-bold">Live Collaboration</h1>
        <p className="text-gray-300 mt-1">Join existing coding sessions with your team</p>
      </div>
      
      <div className="flex-grow px-6 pb-6">
        <div className="max-w-2xl backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Join a Session</h2>
          <p className="text-gray-300 mb-6">Enter a session code to collaborate in real-time with other developers.</p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-300 mb-2">
                Session Code
              </label>
              <input
                id="sessionCode"
                type="text"
                placeholder="Enter the session code"
                className="w-full p-3 border border-gray-200/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
              />
            </div>
            
            <button 
              onClick={handleJoinSession}
              className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
            >
              Join Session
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-white/5 rounded-lg border border-gray-200/10">
            <h3 className="text-white font-medium mb-2">What is a session code?</h3>
            <p className="text-gray-300 text-sm">
              A session code is a unique identifier for a collaborative coding workspace. 
              When someone shares a workspace with you, they'll provide you with this code.
              Enter it above to join their session and collaborate in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Collaboration; 