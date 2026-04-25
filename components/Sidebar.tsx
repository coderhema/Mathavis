import React from 'react';
import { Map, BookOpen, Star, Zap, Heart, Trophy, ShoppingBag, Sun, Moon, Book } from 'lucide-react';
import { View } from '../types';
import VoxelChicken from './VoxelChicken';
import { soundService } from '../services/soundService';

interface UserStats {
    xp: number;
    lives: number;
    league: string;
}

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  stats?: UserStats;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, stats, isDarkMode, toggleDarkMode }) => {
  const currentStats = stats || { xp: 0, lives: 5, league: 'Bronze' };

  const NavButton = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button 
        onClick={() => {
            soundService.playBoop();
            setView(view);
        }}
        className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-all border-2 uppercase text-xs lg:text-sm font-extrabold tracking-widest ${
          currentView === view 
            ? 'bg-blue-50 dark:bg-brand-blue/10 text-brand-blue border-brand-blue shadow-sm' 
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
        }`}
    >
        <Icon size={24} />
        <span>{label}</span>
    </button>
  );

  const handleToggleTheme = () => {
    soundService.playBoop();
    if (toggleDarkMode) toggleDarkMode();
  };

  return (
    <div className="hidden md:flex flex-col w-64 lg:w-72 xl:w-80 shrink-0 bg-white dark:bg-slate-900 border-r-2 border-slate-200 dark:border-slate-800 p-5 lg:p-6 h-dvh sticky top-0 z-30 overflow-y-auto transition-colors duration-300">
      <div className="mb-8 px-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <VoxelChicken size={32} />
          <h1 className="text-xl lg:text-2xl font-extrabold text-brand-green tracking-tight truncate">MathLingo</h1>
        </div>
        
        {toggleDarkMode && (
          <button 
            onClick={handleToggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2 min-w-0">
        <NavButton view="path" icon={Map} label="Learning Path" />
        <NavButton view="practice" icon={BookOpen} label="Whiteboard" />
        <NavButton view="library" icon={Book} label="Library" />
        <NavButton view="leaderboard" icon={Trophy} label="Leaderboard" />
        <NavButton view="shop" icon={ShoppingBag} label="Shop" />
      </nav>

      {/* Stats / Gamification Elements */}
      <div className="mt-auto space-y-4 pt-6 border-t-2 border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => { soundService.playBoop(); setView('shop'); }}>
            <div className="flex items-center space-x-3 text-brand-yellowDark font-extrabold">
                <Zap className="fill-brand-yellow text-brand-yellow" size={24} />
                <span>{currentStats.xp} XP</span>
            </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => { soundService.playBoop(); setView('shop'); }}>
            <div className="flex items-center space-x-3 text-brand-redDark font-extrabold">
                <Heart className="fill-brand-red text-brand-red" size={24} />
                <span>{currentStats.lives}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600 text-xs font-black uppercase tracking-widest">Lives</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => { soundService.playBoop(); setView('leaderboard'); }}>
            <div className="flex items-center space-x-3 text-brand-purpleDark font-extrabold">
                <Star className="fill-brand-purple text-brand-purple" size={24} />
                <span>{currentStats.league}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-600 text-xs font-black uppercase tracking-widest">League</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;