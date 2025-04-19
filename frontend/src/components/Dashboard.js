import React, { useState } from 'react';
import Home from './dashboard/Home';
import Workspaces from './dashboard/Workspaces';
import Collaboration from './dashboard/Collaboration';
import Settings from './dashboard/Settings';
import Sidebar from './dashboard/Sidebar';
import { AuroraBackground } from "./ui/aurora-background";

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
    <div className=" min-h-screen">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
        <div className={`flex-1 mt-9 transition-all duration-300 ${isSidebarOpen ? 'ml-[230px]' : 'ml-20'}`}>
            <AuroraBackground>
              {renderContent()}
            </AuroraBackground>
        </div>
    </div>
  );
}

export default Dashboard; 