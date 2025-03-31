import React, { useEffect, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';

function Workspaces() {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
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

  const handleOpenWorkspace = (link) => {
    navigate(`/editor/${link}`);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl text-white font-bold mb-6">My Workspaces</h1>

      {/* Create Workspace Card */}
      <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Create a New Workspace</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg 
            hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02]"
        >
          Create a Workspace
        </button>
      </div>

      {/* Recent Workspaces */}
      <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-xl">
        <div className="p-4 border-b border-gray-200/20 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Your Workspaces</h2>
          <span className="text-sm text-gray-400">{workspaces.length} workspaces</span>
        </div>
        <div className="overflow-auto">
          {workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {workspaces.map((workspace) => (
                <div key={workspace._id} className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-medium text-gray-900">{workspace.name}</h3>
                  <p className="text-sm text-gray-500">Language: {workspace.language}</p>
                  <p className="text-sm text-gray-500">Created At: {new Date(workspace.createdAt).toLocaleDateString()}</p>
                  <button 
                    onClick={() => handleOpenWorkspace(workspace.link)}
                    className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg 
                      hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Open Workspace
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="text-lg">No workspaces yet</p>
              <p className="text-sm mt-2">Create your first workspace to get started</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create a Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Workspaces;
