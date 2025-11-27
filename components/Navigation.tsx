import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Home', icon: '🏠' },
    { id: AppView.WARDROBE, label: 'Closet', icon: '👚' },
    { id: AppView.STYLIST, label: 'Stylist', icon: '✨' },
    { id: AppView.WISHLIST, label: 'Wishes', icon: '🛍️' },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-pink-100 pb-safe pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-16 transition-all duration-300 ${
              currentView === item.id
                ? 'text-pink-500 transform -translate-y-2'
                : 'text-gray-400 hover:text-pink-300'
            }`}
          >
            <span className="text-2xl mb-1 filter drop-shadow-sm">{item.icon}</span>
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            {currentView === item.id && (
              <div className="w-1 h-1 bg-pink-500 rounded-full mt-1 animate-bounce" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navigation;
