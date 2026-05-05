import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Sidebar from './components/Sidebar';
import TopicPath from './components/TopicPath';
import Whiteboard from './components/Whiteboard';
import Library from './components/Library';
import AuthPage from './components/AuthPage';
import Waitlist from './components/Waitlist';
import Leaderboard from './components/Leaderboard';
import Shop from './components/Shop';
import PracticeMenu from './components/PracticeMenu';
import VoxelChicken from './components/VoxelChicken';
import { Topic, View } from './types';
import { Menu, X, Sun, Moon, Plus, Map, BookOpen, Book, Trophy, ShoppingBag } from 'lucide-react';
import { soundService } from './services/soundService';
import { ThemeToggle } from './components/ThemeToggle';

const DEFAULT_TOPICS: Topic[] = [
    { id: 'algebra', name: 'Linear Algebra', description: 'Vectors, Matrices, Spaces', color: 'bg-brand-blue', icon: 'grid', completed: 60 },
    { id: 'calc', name: 'Calculus I', description: 'Limits, Derivatives, Integrals', color: 'bg-brand-green', icon: 'wave', completed: 30 },
    { id: 'discrete', name: 'Discrete Math', description: 'Sets, Logic, Combinatorics', color: 'bg-brand-purple', icon: 'node', completed: 0 },
    { id: 'graph', name: 'Graph Theory', description: 'Trees, Cycles, Paths', color: 'bg-brand-red', icon: 'network', completed: 0 },
];

const TOPICS_STORAGE_KEY = 'mathlingo_persistent_topics';

const NAV_ITEMS: Array<{ view: Exclude<View, 'auth'>; label: string; icon: React.ElementType }> = [
  { view: 'path', label: 'Learning Path', icon: Map },
  { view: 'practice', label: 'Whiteboard', icon: BookOpen },
  { view: 'library', label: 'Library', icon: Book },
  { view: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { view: 'shop', label: 'Shop', icon: ShoppingBag },
];

const getViewLabel = (view: View, selectedTopic: Topic | null) => {
  if (view === 'path') return 'Learning Path';
  if (view === 'practice') return selectedTopic?.name ?? 'Whiteboard';
  if (view === 'library') return 'Library';
  if (view === 'leaderboard') return 'Leaderboard';
  if (view === 'shop') return 'Shop';
  return 'MathLingo';
};

interface UserStats {
    xp: number;
    lives: number;
    league: string;
}

const App: React.FC = () => {
  const [currentView, setView] = useState<View>('auth');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [sessionTrigger, setSessionTrigger] = useState(0);
  const [initialHistoryOpen, setInitialHistoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [practiceMode, setPracticeMode] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('mathlingo_dark_mode') === 'true';
  });
  const [topics, setTopics] = useState<Topic[]>(() => {
    try {
        const saved = localStorage.getItem(TOPICS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_TOPICS;
    } catch {
        return DEFAULT_TOPICS;
    }
  });
  const [isTopicPromptOpen, setIsTopicPromptOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [pathname, setPathname] = useState(() => window.location.pathname);

  // Persistent User Stats
  const [userStats, setUserStats] = useState<UserStats>(() => {
      try {
          const saved = localStorage.getItem('mathlingo_user_stats');
          return saved ? JSON.parse(saved) : { xp: 124, lives: 5, league: 'Diamond' };
      } catch {
          return { xp: 124, lives: 5, league: 'Diamond' };
      }
  });

  useEffect(() => {
      localStorage.setItem('mathlingo_user_stats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mathlingo_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    setSessionTrigger(prev => prev + 1);
    setInitialHistoryOpen(false);
    setPracticeMode(null); // Reset mode when selecting a topic
    setView('practice');
  };

  const handleOpenHistory = () => {
    setInitialHistoryOpen(true);
    setView('practice');
  };

  const handleNavChange = (view: View) => {
    soundService.playBoop();
    setView(view);
    if (view === 'path') setSelectedTopic(null); // Reset topic when going back to path
    if (view === 'practice') setPracticeMode(null); // Reset practice mode when clicking practice tab
    setInitialHistoryOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleOpenTopicPrompt = () => {
    soundService.playBoop();
    setIsTopicPromptOpen(true);
    setNewTopicName('');
    setIsMobileMenuOpen(false);
  };

  const confirmNewTopic = (name: string) => {
    if (!name.trim()) return;
    
    const newTopic: Topic = {
        id: 'topic-' + Date.now(),
        name: name.trim(),
        description: 'Custom Exploration',
        color: 'bg-brand-green',
        icon: 'plus',
        completed: 0
    };
    
    setTopics(prev => [...prev, newTopic]);
    setIsTopicPromptOpen(false);
    soundService.playLevelUp();
    handleTopicSelect(newTopic);
  };

  const handleLogin = () => {
      soundService.playBoop();
      setIsAuthenticated(true);
      setView('path');
  };

  const addXP = (amount: number) => {
      if (amount > 0) soundService.playPop();
      setUserStats(prev => ({ ...prev, xp: prev.xp + amount }));
  };

  const toggleDarkMode = (nextDark?: boolean) => {
    setIsDarkMode(prev => nextDark !== undefined ? nextDark : !prev);
  };

  if (pathname === '/waitlist') {
    return (
      <>
        <Waitlist />
        <Analytics />
      </>
    );
  }

  if (!isAuthenticated) {
      return (
        <>
          <AuthPage onLogin={handleLogin} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          <Analytics />
        </>
      );
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden dark-transition" style={{ background: 'var(--bg2)', color: 'var(--text)' }}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(4px)' }}
          onClick={() => { soundService.playBoop(); setIsMobileMenuOpen(false); }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-[90vw] max-w-[260px] overflow-y-auto flex flex-col dark-transition"
            style={{
              background: 'var(--bg)',
              borderRight: '1px solid var(--border)',
              padding: '20px 16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Logo row */}
            <div className="flex items-center justify-between mb-8 px-1">
              <div className="flex items-center gap-2">
                <VoxelChicken size={30} />
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  letterSpacing: '-0.02em',
                }}>
                  Mathavis
                </span>
              </div>
              <button
                onClick={() => { soundService.playBoop(); setIsMobileMenuOpen(false); }}
                style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 min-w-0">
              {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
                const isActive = currentView === view;
                return (
                  <button
                    key={view}
                    onClick={() => handleNavChange(view)}
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
              })}
            </nav>

            {/* Theme toggle */}
            <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <ThemeToggle
                onToggle={(dark) => setIsDarkMode(dark)}
                isDarkMode={isDarkMode}
                showText={true}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text2)',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar with dynamic stats */}
      <Sidebar 
        currentView={currentView} 
        setView={handleNavChange} 
        stats={userStats}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col relative isolate overflow-y-auto">
        {/* Mobile Header */}
        <div
          className="md:hidden sticky top-0 z-[80] flex items-center justify-between px-4 sm:px-6 py-4 dark-transition"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
        >
          <button onClick={() => { soundService.playBoop(); setIsMobileMenuOpen(true); }}>
            <Menu size={22} style={{ color: 'var(--text2)' }} />
          </button>
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: 'var(--text3)',
          }}>
            {getViewLabel(currentView, selectedTopic)}
          </span>
            <div className="flex items-center gap-4">
              <ThemeToggle
                onToggle={(dark) => setIsDarkMode(dark)}
                isDarkMode={isDarkMode}
                iconSize={18}
                style={{ color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer' }}
              />
            </div>
        </div>

        {currentView === 'path' && (
          <TopicPath 
            topics={topics}
            onSelectTopic={handleTopicSelect} 
            onNewModuleClick={handleOpenTopicPrompt}
          />
        )}
        {currentView === 'practice' && !practiceMode && (
            <PracticeMenu onSelectMode={(mode) => setPracticeMode(mode)} />
        )}
        {currentView === 'practice' && practiceMode && (
            <Whiteboard 
                initialTopic={selectedTopic?.name} 
                onXPChange={addXP}
                sessionTrigger={sessionTrigger}
                initialHistoryOpen={initialHistoryOpen}
                onNewModuleClick={handleOpenTopicPrompt}
                practiceMode={practiceMode}
                onBackToMenu={() => setPracticeMode(null)}
            />
        )}
        {currentView === 'library' && <Library />}
        {currentView === 'leaderboard' && <Leaderboard />}
        {currentView === 'shop' && <Shop />}
      </div>

      {/* Shared Topic Prompt Modal */}
      {isTopicPromptOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(12px)' }}
        >
          <div className="ds-card w-full max-w-md p-6 sm:p-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--blue-tint2)' }}
              >
                <Plus size={24} style={{ color: 'var(--blue)' }} />
              </div>
              <div>
                <h2 style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}>New Module</h2>
                <p className="mono-label">What are we learning today?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmNewTopic(newTopicName)}
                  placeholder="e.g. Linear Algebra, Calculus..."
                  className="ds-input"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsTopicPromptOpen(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmNewTopic(newTopicName)}
                  className="btn-cta flex-1"
                >
                  Start Learning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Analytics />
    </div>
  );
};

export default App;
