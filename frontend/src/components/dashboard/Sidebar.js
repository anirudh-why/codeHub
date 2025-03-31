import React from 'react';
import { FaBars, FaTimes, FaHome, FaFolder, FaUsers, FaCog } from 'react-icons/fa';

function Sidebar({ activeTab, setActiveTab, isSidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: FaHome },
    { id: 'workspaces', label: 'My Workspaces', icon: FaFolder },
    { id: 'collab', label: 'Live Collaboration', icon: FaUsers },
    { id: 'settings', label: 'Settings', icon: FaCog },
  ];

  return (
    <div className={`fixed top-0 left-0 h-full transition-width duration-300 ease-in-out ${isSidebarOpen ? 'w-70' : 'w-20'}`}>
      <div className="h-full bg-black shadow-xl flex flex-col">
        {/* Logo Section */}
        <div className="flex items-center h-16 px-6 border-b border-gray-800">
          {isSidebarOpen ? (
            <span className="text-white text-xl font-bold">CodeHub</span>
          ) : (
            <span className="text-white text-xl font-bold">CH</span>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={<item.icon size={20} />}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              isExpanded={isSidebarOpen}
            />
          ))}
        </div>

        {/* Toggle Button */}
        <div className="px-4 py-4 border-t border-gray-800">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
          >
            {isSidebarOpen ? (
              <>
                <FaTimes size={16} className="mr-2" />
                <span>Collapse Sidebar</span>
              </>
            ) : (
              <FaBars size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick, isExpanded }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-4 px-4 py-3.5 rounded-lg mb-2 transition-all duration-200
      ${active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    title={!isExpanded ? label : ''}
  >
    <div className="flex-shrink-0">{icon}</div>
    {isExpanded && (
      <span className="text-base font-medium truncate">
        {label}
      </span>
    )}
  </button>
);

export default Sidebar;
