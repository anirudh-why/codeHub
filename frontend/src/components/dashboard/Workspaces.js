import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiFolder, FiFile, FiUsers, FiClock, FiTrash2, FiExternalLink, FiPlus } from 'react-icons/fi';

function Workspaces() {
  const [user, setUser] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/dashboard/${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
      } else {
        toast.error('Failed to load workspaces');
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkspace = (link) => {
    navigate(`/editor/${link}`);
  };

  const deleteWorkspace = async (workspaceId) => {
    if (!window.confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmail: user.email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workspace');
      }

      toast.success('Workspace deleted successfully');
      setWorkspaces(workspaces.filter(w => w.link !== workspaceId));
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error(`Error deleting workspace: ${error.message}`);
    }
  };

  const leaveWorkspace = async (workspaceId) => {
    if (!window.confirm('Are you sure you want to leave this workspace?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmail: user.email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to leave workspace');
      }

      toast.success('Left workspace successfully');
      setWorkspaces(workspaces.filter(w => w.link !== workspaceId));
    } catch (error) {
      console.error('Error leaving workspace:', error);
      toast.error(`Error leaving workspace: ${error.message}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get time difference
  const getTimeDifference = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle search
  const filteredWorkspaces = searchQuery
    ? workspaces.filter(
        workspace =>
          workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workspace.language.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workspaces;

  // Get role display text and icon
  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin':
        return { text: 'Admin', color: 'bg-red-500' };
      case 'editor':
        return { text: 'Editor', color: 'bg-green-500' };
      case 'viewer':
        return { text: 'Viewer', color: 'bg-blue-500' };
      default:
        return { text: role, color: 'bg-gray-500' };
    }
  };

  return (
    <div className="absolute inset-0 pt-6 pl-6 pr-6 flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl text-white font-bold">My Workspaces</h1>
          <p className="text-gray-300 mt-1">Manage all your coding workspaces</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-64 bg-white/10 border border-gray-200/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <FiPlus />
            <span>New Workspace</span>
          </button>
        </div>
      </div>
      
      <div className="flex-grow px-6 pb-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredWorkspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace) => {
              const roleInfo = getRoleDisplay(workspace.role);
              
              return (
                <div
                  key={workspace.link}
                  className="backdrop-blur-md bg-white/10 border border-gray-200/20 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-white truncate">{workspace.name}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenWorkspace(workspace.link)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Open workspace"
                        >
                          <FiExternalLink />
                        </button>
                        {workspace.role === 'admin' ? (
                          <button
                            onClick={() => deleteWorkspace(workspace.link)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete workspace"
                          >
                            <FiTrash2 />
                          </button>
                        ) : (
                          <button
                            onClick={() => leaveWorkspace(workspace.link)}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                            title="Leave workspace"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Language */}
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span className="text-gray-300 capitalize">{workspace.language}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white/5 rounded p-2 text-center">
                        <div className="flex items-center justify-center text-blue-400 mb-1">
                          <FiUsers />
                        </div>
                        <div className="text-xs text-gray-300">{workspace.userCount || 0} Users</div>
                      </div>
                      <div className="bg-white/5 rounded p-2 text-center">
                        <div className="flex items-center justify-center text-green-400 mb-1">
                          <FiFile />
                        </div>
                        <div className="text-xs text-gray-300">{workspace.fileCount || 0} Files</div>
                      </div>
                      <div className="bg-white/5 rounded p-2 text-center">
                        <div className="flex items-center justify-center text-yellow-400 mb-1">
                          <FiFolder />
                        </div>
                        <div className="text-xs text-gray-300">{workspace.folderCount || 0} Folders</div>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="flex justify-between text-xs text-gray-400">
                      <div>Created: {formatDate(workspace.createdAt)}</div>
                      <div className="flex items-center">
                        <FiClock className="mr-1" />
                        {getTimeDifference(workspace.lastActive || workspace.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Role Indicator */}
                  <div 
                    className="h-1.5" 
                    style={{ 
                      background: workspace.role === 'admin' 
                        ? 'linear-gradient(to right, #6366f1, #8b5cf6)' 
                        : workspace.role === 'editor' 
                          ? 'linear-gradient(to right, #10b981, #3b82f6)' 
                          : 'linear-gradient(to right, #6b7280, #4b5563)'
                    }}
                  ></div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="backdrop-blur-md bg-white/10 border border-gray-200/20 p-8 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Workspaces Found</h3>
              <p className="text-gray-400 mb-6">You don't have any workspaces yet or none match your search</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center"
              >
                <FiPlus className="mr-2" />
                Create New Workspace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Workspaces;
