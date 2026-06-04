import React from 'react';
import { LayoutDashboard, CloudRain, TrendingUp, Bot, LogOut, Droplets } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Sidebar = ({ currentView, setCurrentView }) => {
  const { logout, language, setLanguage, t } = useAppContext();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'weather', label: 'Weather', icon: CloudRain },
    { id: 'market', label: 'Market', icon: TrendingUp },

    { id: 'soilmoisture', label: 'Soil Moisture', icon: Droplets },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-xl border-r border-gray-100 flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] hidden md:flex transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-nature-500 text-white flex items-center justify-center font-bold text-xl">
          Y
        </div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-nature-600 to-teal-600">
          Karshaka AI
        </h2>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-nature-50 text-nature-700 font-semibold shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-nature-600'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              {t(item.id)}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="mb-4">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:ring-2 focus:ring-nature-500 focus:bg-white transition-all outline-none"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
            <option value="ml">മലയാളം</option>
          </select>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-300 font-medium"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
