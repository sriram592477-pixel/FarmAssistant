import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X, Bell, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const DashboardLayout = ({ children, currentView, setCurrentView }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, t } = useAppContext();

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden font-sans">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 w-64 bg-white shadow-2xl`}>
        <div className="flex justify-end p-4">
          <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-[-60px] h-full">
          <Sidebar currentView={currentView} setCurrentView={(view) => { setCurrentView(view); setMobileMenuOpen(false); }} />
        </div>
      </div>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 capitalize tracking-tight">
              {t(currentView) || currentView}
            </h1>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button className="relative p-2 text-gray-400 hover:text-nature-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-700">{user?.username}</p>
                <p className="text-xs text-nature-600 font-medium">{t('farmerAccount')}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-nature-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-nature-500/20">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-10 hide-scrollbar">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
