import React from 'react';
import ClayButton from './ClayButton';
import { Home, LayoutDashboard, History, Sparkles } from 'lucide-react';

export default function Navigation({ activeTab, onNavigate }) {
  const navItems = [
    { id: 'landing', label: 'Start', icon: Home },
    { id: 'workspace', label: 'Workspace', icon: Sparkles },
    { id: 'dashboard', label: 'Progress', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="w-full flex justify-center sticky top-6 z-50 px-4">
      <nav className="clay-card rounded-full px-4 py-3 flex items-center gap-2 md:gap-4 bg-white/90 backdrop-blur-md">
        <div 
          className="font-baloo font-bold text-2xl text-[var(--color-brand-primary)] px-4 mr-2 cursor-pointer"
          onClick={() => onNavigate('landing')}
        >
          EviLearn
        </div>
        
        <div className="flex items-center gap-2">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-baloo font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-[var(--color-brand-bg)] text-[var(--color-brand-primary)] shadow-[inset_2px_2px_4px_rgba(79,70,229,0.1),_inset_-2px_-2px_4px_rgba(255,255,255,1)]' 
                    : 'text-[var(--color-brand-text)]/70 hover:bg-[var(--color-brand-bg)]/50 hover:text-[var(--color-brand-text)]'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
