import React, { useState, useRef } from 'react';
import { FiSearch, FiX, FiUserPlus, FiUserMinus, FiEdit2 } from 'react-icons/fi';
import { BiCrown } from 'react-icons/bi';

function UsersPanel({
  activeUsers,
  userRole,
  userId,
  room,
  searchUsers,
  searchResults,
  setSearchResults,
  searchTerm,
  setSearchTerm,
  addUserToRoom,
  showUserSearch,
  setShowUserSearch,
  changeUserRole
}) {
  const searchRef = useRef(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Handle user search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setSearchLoading(true);
    await searchUsers(searchTerm);
    setSearchLoading(false);
  };

  // Clear search results
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  // Get role display label and color
  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', color: 'text-yellow-500' };
      case 'editor':
        return { label: 'Editor', color: 'text-green-500' };
      case 'viewer':
        return { label: 'Viewer', color: 'text-blue-500' };
      default:
        return { label: 'Unknown', color: 'text-gray-500' };
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3">
      {/* Users Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Participants</h3>
        {(userRole === 'owner' || userRole === 'editor') && (
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded flex items-center gap-1"
          >
            {showUserSearch ? <FiX size={12} /> : <FiUserPlus size={12} />}
            {showUserSearch ? 'Cancel' : 'Add User'}
          </button>
        )}
      </div>

      {/* User Search */}
      {showUserSearch && (userRole === 'owner' || userRole === 'editor') && (
        <div className="mb-3">
          <form onSubmit={handleSearch} className="flex mb-2">
            <input
              ref={searchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by email..."
              className="flex-1 bg-gray-700 text-white text-sm rounded-l px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 rounded-r px-3 flex items-center"
              disabled={searchLoading}
            >
              {searchLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
              ) : (
                <FiSearch size={16} />
              )}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="bg-gray-700 rounded mb-3 max-h-40 overflow-y-auto custom-scrollbar">
              {searchResults.map((user) => {
                const isAlreadyAdded = room.users.some(u => u.userId === user._id);
                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-2 hover:bg-gray-600 border-b border-gray-600 last:border-b-0"
                  >
                    <div className="flex-1 truncate text-sm">{user.email}</div>
                    {isAlreadyAdded ? (
                      <span className="text-xs text-gray-400">Already added</span>
                    ) : (
                      <button
                        onClick={() => addUserToRoom(user._id, user.email)}
                        className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <FiUserPlus size={10} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {searchTerm && searchResults.length === 0 && !searchLoading && (
            <div className="text-center text-gray-400 text-sm py-2">
              No users found
            </div>
          )}
          
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mx-auto"
            >
              <FiX size={10} /> Clear search
            </button>
          )}
        </div>
      )}

      {/* Active Users List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {room?.users?.map((user) => {
            const isActive = activeUsers.some(u => u.userId === user.userId);
            const isCurrentUser = user.userId === userId;
            const roleInfo = getRoleLabel(user.role);
            
            return (
              <div
                key={user.userId}
                className={`flex items-center p-2 rounded ${
                  isActive ? 'bg-gray-700 bg-opacity-60' : 'opacity-60'
                }`}
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                
                <div className="ml-2 flex-1 overflow-hidden">
                  <div className="text-sm truncate flex items-center gap-1">
                    {user.email}
                    {user.role === 'owner' && (
                      <BiCrown size={14} className="text-yellow-500" title="Owner" />
                    )}
                    {isCurrentUser && <span className="text-xs text-gray-400">(you)</span>}
                  </div>
                  <div className={`text-xs ${roleInfo.color}`}>{roleInfo.label}</div>
                </div>
                
                {userRole === 'owner' && !isCurrentUser && (
                  <div className="dropdown relative">
                    <button className="text-gray-400 hover:text-white p-1">
                      <FiEdit2 size={14} />
                    </button>
                    <div className="dropdown-content absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 hidden group-hover:block">
                      <div className="py-1">
                        <button
                          onClick={() => changeUserRole(user.userId, 'editor')}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                          disabled={user.role === 'editor'}
                        >
                          Make Editor
                        </button>
                        <button
                          onClick={() => changeUserRole(user.userId, 'viewer')}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                          disabled={user.role === 'viewer'}
                        >
                          Make Viewer
                        </button>
                        <div className="border-t border-gray-700 my-1"></div>
                        <button
                          onClick={() => changeUserRole(user.userId, 'remove')}
                          className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700"
                        >
                          Remove User
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {(!room?.users || room.users.length === 0) && (
          <div className="text-center text-gray-400 py-4">
            No users in this workspace yet
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersPanel; 