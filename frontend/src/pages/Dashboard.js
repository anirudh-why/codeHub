import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { toast } from 'react-hot-toast';
import { FiPlus, FiCode, FiUsers, FiClock, FiFolder, FiFile, FiTrash2, FiExternalLink, FiLogOut, FiLink } from 'react-icons/fi';

function Dashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceLanguage, setNewWorkspaceLanguage] = useState('javascript');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    language: 'javascript'
  });

  // Get current user
  const user = auth.currentUser;

  // Fetch user's workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/dashboard/${user.email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch workspaces');
        }
        const data = await response.json();
        setWorkspaces(data);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        toast.error('Failed to load workspaces. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user, navigate]);

  // Create new workspace
  const createWorkspace = async (e) => {
    e.preventDefault();
    
    if (!newWorkspace.name.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newWorkspace.name,
          language: newWorkspace.language,
          userEmail: user.email,
          userName: user.displayName || user.email.split('@')[0],
          userPhoto: user.photoURL || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workspace');
      }
      
      const data = await response.json();
      toast.success('Workspace created successfully');
      setIsCreating(false);
      setNewWorkspace({ name: '', language: 'javascript' });
      
      // Navigate to the new workspace
      navigate(`/editor/${data.workspace.link}`);
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error(error.message || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete workspace
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

  // Leave workspace
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

  // Handle search
  const filteredWorkspaces = searchQuery
    ? workspaces.filter(
        workspace =>
          workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workspace.language.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workspaces;

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

  // Sign out
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' }
  ];

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">CodeHub</h1>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <h2 className="text-lg font-semibold mb-4">My Workspaces</h2>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : filteredWorkspaces.length > 0 ? (
            <ul className="space-y-2">
              {filteredWorkspaces.map(workspace => (
                <li 
                  key={workspace.link}
                  className="flex items-center p-2 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={() => navigate(`/editor/${workspace.link}`)}
                >
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                  <div className="flex-1 truncate">{workspace.name}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No workspaces found</p>
          )}
        </div>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-2 mb-2 flex items-center justify-center"
          >
            <FiPlus className="mr-2" /> New Workspace
          </button>
          <div className="flex items-center text-sm text-gray-400 mt-4">
            {user.photoURL && (
              <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full mr-2" />
            )}
            <div className="flex-1 truncate">
              <div className="font-medium">{user.displayName || 'User'}</div>
              <div className="text-xs">{user.email}</div>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white"
              title="Sign out"
            >
              <FiLogOut />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-900">
        <header className="bg-gray-800 p-4 shadow">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Dashboard</h2>
            <div className="w-1/3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Workspaces Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : filteredWorkspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkspaces.map((workspace) => (
                <div
                  key={workspace.link}
                  className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-white truncate">{workspace.name}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/editor/${workspace.link}`);
                          }}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Open workspace"
                        >
                          <FiExternalLink />
                        </button>
                        {workspace.role === 'admin' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteWorkspace(workspace.link);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete workspace"
                          >
                            <FiTrash2 />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              leaveWorkspace(workspace.link);
                            }}
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
                      <FiCode className="text-indigo-400 mr-2" />
                      <span className="text-gray-300 capitalize">{workspace.language}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-gray-700 rounded p-2 text-center">
                        <div className="flex items-center justify-center text-blue-400 mb-1">
                          <FiUsers />
                        </div>
                        <div className="text-xs text-gray-300">{workspace.userCount} Users</div>
                      </div>
                      <div className="bg-gray-700 rounded p-2 text-center">
                        <div className="flex items-center justify-center text-green-400 mb-1">
                          <FiFile />
                        </div>
                        <div className="text-xs text-gray-300">{workspace.fileCount} Files</div>
                      </div>
                      <div className="bg-gray-700 rounded p-2 text-center">
                        <div className="flex items-center justify-center text-yellow-400 mb-1">
                          <FiFolder />
                        </div>
                        <div className="text-xs text-gray-300">{workspace.folderCount} Folders</div>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="flex justify-between text-xs text-gray-400">
                      <div>Created: {formatDate(workspace.createdAt)}</div>
                      <div className="flex items-center">
                        <FiClock className="mr-1" />
                        {getTimeDifference(workspace.lastActive)}
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">No Workspaces Found</h3>
                <p className="text-gray-400 mb-6">Create your first workspace to get started!</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 flex items-center justify-center mx-auto"
                >
                  <FiPlus className="mr-2" /> Create Workspace
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Workspace Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Create New Workspace</h2>
            <form onSubmit={createWorkspace}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={newWorkspace.name}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="My Awesome Project"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Language
                </label>
                <select
                  value={newWorkspace.language}
                  onChange={(e) => setNewWorkspace({ ...newWorkspace, language: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {languageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiPlus className="mr-2" /> Create
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard; 