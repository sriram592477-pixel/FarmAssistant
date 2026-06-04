import React, { useState } from 'react';
import { useAppContext } from './context/AppContext';
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout';
import DashboardOverview from './pages/DashboardOverview';
import Weather from './pages/Weather';
import Market from './pages/Market';

import AIAssistant from './pages/AIAssistant';
import SoilMoisture from './pages/SoilMoisture';

function App() {
  const { isAuthenticated } = useAppContext();
  const [currentView, setCurrentView] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardOverview />;
      case 'weather': return <Weather />;
      case 'market': return <Market />;

      case 'soilmoisture': return <SoilMoisture />;
      case 'ai': return <AIAssistant />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout currentView={currentView} setCurrentView={setCurrentView}>
      {renderView()}
    </DashboardLayout>
  );
}

export default App;
