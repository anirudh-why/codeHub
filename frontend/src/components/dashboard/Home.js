import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState('javascript');
  const [sessionCode, setSessionCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        fetchWorkspaces(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchWorkspaces = async (userEmail) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/user/${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newWorkspaceName,
          language: newWorkspaceType,
          createdBy: user.email 
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowCreateModal(false);
        fetchWorkspaces(user.email);
        navigate(`/editor/${data.link}`);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
    }
  };

  const handleOpenWorkspace = (link) => {
    navigate(`/editor/${link}`);
  };

  const handleJoinSession = () => {
    if (sessionCode.trim()) {
      navigate(`/editor/${sessionCode}`);
    }
  };

  return (
    <div className="absolute inset-0 pt-6 pl-6 pr-6 flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-8">
        <h1 className="text-3xl text-white font-bold">Welcome, {user?.displayName || 'Coder'}</h1>
        <p className="text-gray-300 mt-1">Manage your coding workspaces</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 px-6 pb-5">
        <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg shadow-lg p-5 hover:shadow-xl transition-shadow lg:col-span-2">
          <h2 className="text-xl font-semibold text-white mb-3">Create a Workspace</h2>
          <p className="text-gray-300 text-sm mb-4">Start a new coding project with your preferred language</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors transform hover:scale-[1.02] duration-200"
          >
            Create a Workspace
          </button>
        </div>

        <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg shadow-lg p-5 hover:shadow-xl transition-shadow lg:col-span-3">
          <h2 className="text-xl font-semibold text-white mb-3">Join a Session</h2>
          <p className="text-gray-300 text-sm mb-4">Collaborate in real-time with others</p>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter session code"
              className="flex-1 p-2 border border-gray-200/20 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
            />
            <button 
              onClick={handleJoinSession}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors transform hover:scale-[1.02] duration-200">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col px-6 pb-6">
        <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg shadow-lg flex-grow flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200/20 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Recent Workspaces</h2>
            <span className="text-sm text-gray-300 bg-white/5 px-3 py-1 rounded-full">{workspaces.length} workspaces</span>
          </div>
          <div className="overflow-auto flex-grow">
            {workspaces.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200/20">
                <thead className="bg-black/20 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-gray-200/20">
                  {workspaces.map((workspace) => (
                    <tr key={workspace._id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 text-center  whitespace-nowrap">
                        <div className="font-medium text-white">{workspace.name}</div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
                          {workspace.language}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-gray-300">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => handleOpenWorkspace(workspace.link)}
                          className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Open
                          <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg text-white">No workspaces yet</p>
                <p className="text-sm mt-2 text-gray-400">Create your first workspace to get started</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create a Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-white">Create New Workspace</h3>
            <input
              type="text"
              placeholder="Workspace Name"
              className="w-full p-3 border border-gray-200/20 rounded-lg bg-white/5 text-white placeholder-gray-400 mb-4 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
            />
            <select
              className="w-full p-3 border border-gray-200/20 rounded-lg bg-white/5 text-white mb-6 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              value={newWorkspaceType}
              onChange={(e) => setNewWorkspaceType(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="ruby">Ruby</option>
            </select>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 
                  transform hover:scale-[1.02] transition-all duration-200"
                onClick={handleCreateWorkspace}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;