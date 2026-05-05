import React from 'react';
import { Map, BookOpen, Star, Zap, Heart, Trophy, ShoppingBag, Sun, Moon, Book } from 'lucide-react';
import { View } from '../types';
import VoxelChicken from './VoxelChicken';
import { soundService } from '../services/soundService';
import { ThemeToggle } from './ThemeToggle';

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
  toggleDarkMode?: (nextDark: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, stats, isDarkMode, toggleDarkMode }) => {
  const currentStats = stats || { xp: 0, lives: 5, league: 'Bronze' };

  const NavButton = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => { soundService.playBoop(); setView(view); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '10px 14px',
          borderRadius: 12,
          border: isActive ? '1.5px solid var(--blue)' : '1.5px solid transparent',
          background: isActive ? 'var(--blue-tint2)' : 'transparent',
          color: isActive ? 'var(--blue)' : 'var(--text2)',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          fontWeight: isActive ? 700 : 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.2s',
        } as React.CSSProperties}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    );
  };


  return (
    <div
      className="hidden md:flex flex-col shrink-0 h-dvh sticky top-0 z-30 overflow-y-auto dark-transition"
      style={{
        width: 240,
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        padding: '20px 16px',
      }}
    >
      {/* Logo row */}
      <div className="flex items-center justify-between mb-8 px-1">
        <div className="flex items-center gap-2">
          <VoxelChicken size={30} />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '-0.02em',
            }}
          >
            Mathavis
          </span>
        </div>
        <ThemeToggle 
          className="theme-toggle" 
          style={{ width: 30, height: 30 }} 
          iconSize={14} 
          isDarkMode={isDarkMode || false}
          onToggle={toggleDarkMode || (() => {})} 
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 min-w-0">
        <NavButton view="path"        icon={Map}         label="Learning Path" />
        <NavButton view="practice"    icon={BookOpen}    label="Whiteboard"    />
        <NavButton view="library"     icon={Book}        label="Library"       />
        <NavButton view="leaderboard" icon={Trophy}      label="Leaderboard"   />
        <NavButton view="shop"        icon={ShoppingBag} label="Shop"          />
      </nav>

      {/* Stats */}
      <div
        className="mt-auto space-y-2 pt-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {[
          { icon: Zap,   fill: 'var(--accent)', value: `${currentStats.xp} XP`,   label: '',        view: 'shop'        as View },
          { icon: Heart, fill: '#ef4444',        value: String(currentStats.lives), label: 'Lives',   view: 'shop'        as View },
          { icon: Star,  fill: '#8b5cf6',        value: currentStats.league,        label: 'League',  view: 'leaderboard' as View },
        ].map(({ icon: Icon, fill, value, label, view }) => (
          <button
            key={value}
            onClick={() => { soundService.playBoop(); setView(view); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 10px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: fill, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>
              <Icon size={18} style={{ fill }} />
              <span>{value}</span>
            </div>
            {label && (
              <span
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text3)' }}
              >
                {label}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
