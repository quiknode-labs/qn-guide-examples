import React, { useState } from 'react';
import LogsTab from './LogsTab';
import DashboardTab from './DashboardTab';

function MainPage({ streamData }) {
  const [activeTab, setActiveTab] = useState('logs');

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-2 mb-4">
        <button 
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeTab === 'logs' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'logs' && <LogsTab data={streamData} />}
        {activeTab === 'dashboard' && <DashboardTab data={streamData} />}
      </div>
    </div>
  );
}

export default MainPage;
