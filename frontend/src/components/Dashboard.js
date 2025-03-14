import React, { useState } from 'react';
import Home from './dashboard/Home';
import Workspaces from './dashboard/Workspaces';
import Collaboration from './dashboard/Collaboration';
import Settings from './dashboard/Settings';
import Sidebar from './dashboard/Sidebar';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'workspaces':
        return <Workspaces />;
      case 'collab':
        return <Collaboration />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <div className="p-8 mt-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 