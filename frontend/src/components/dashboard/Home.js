import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState('javascript');
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Welcome, {user?.email}</h1>

      {/* Create New Workspace & Join Session */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Create a Workspace</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors
              transform hover:scale-[1.02] duration-200"
          >
            Create a Workspace
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Join a Session</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter session code"
              className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors
              transform hover:scale-[1.02] duration-200">
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Recent Workspaces */}
      <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Workspaces</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workspaces.map((workspace) => (
                  <tr key={workspace._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {workspace.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {workspace.language}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(workspace.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenWorkspace(workspace.link)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors"
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Create New Workspace</h3>
            <input
              type="text"
              placeholder="Workspace Name"
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
            />
            <select
              className="w-full p-3 border rounded-lg mb-6 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
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
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
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
