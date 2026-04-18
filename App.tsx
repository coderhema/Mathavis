import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Sidebar from './components/Sidebar';
import TopicPath from './components/TopicPath';
import Whiteboard from './components/Whiteboard';
import Library from './components/Library';
import AuthPage from './components/AuthPage';
import Leaderboard from './components/Leaderboard';
import Shop from './components/Shop';
import PracticeMenu from './components/PracticeMenu';
import { Topic, View } from './types';
import { Menu, X, Sun, Moon, History, Plus } from 'lucide-react';
import { soundService } from './services/soundService';

const DEFAULT_TOPICS: Topic[] = [
    { id: 'algebra', name: 'Linear Algebra', description: 'Vectors, Matrices, Spaces', color: 'bg-brand-blue', icon: 'grid', completed: 60 },
    { id: 'calc', name: 'Calculus I', description: 'Limits, Derivatives, Integrals', color: 'bg-brand-green', icon: 'wave', completed: 30 },
    { id: 'discrete', name: 'Discrete Math', description: 'Sets, Logic, Combinatorics', color: 'bg-brand-purple', icon: 'node', completed: 0 },
    { id: 'graph', name: 'Graph Theory', description: 'Trees, Cycles, Paths', color: 'bg-brand-red', icon: 'network', completed: 0 },
];

const TOPICS_STORAGE_KEY = 'mathlingo_persistent_topics';

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

  const toggleDarkMode = () => {
    soundService.playBoop();
    setIsDarkMode(prev => !prev);
  };

  if (!isAuthenticated) {
      return (
        <>
          <AuthPage onLogin={handleLogin} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          <Analytics />
        </>
      );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => { soundService.playBoop(); setIsMobileMenuOpen(false); }}>
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 p-4 border-r dark:border-slate-800" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-extrabold text-brand-green">MathLingo</h1>
                    <button onClick={() => { soundService.playBoop(); setIsMobileMenuOpen(false); }} className="dark:text-slate-400">
                        <X size={24} />
                    </button>
                </div>
                <nav className="space-y-4">
                     {['path', 'practice', 'leaderboard', 'shop'].map((v) => (
                         <button 
                            key={v}
                            onClick={() => handleNavChange(v as View)}
                            className="block w-full text-left p-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 capitalize transition-colors"
                        >
                            {v === 'path' ? 'Learning Path' : v}
                        </button>
                     ))}
                     <button 
                        onClick={() => { soundService.playBoop(); handleOpenHistory(); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 w-full text-left p-3 rounded-xl font-bold text-brand-blue hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <History size={20} />
                        <span>Session History</span>
                    </button>
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                  <button 
                    onClick={toggleDarkMode}
                    className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold"
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
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
      <div className="flex-1 flex flex-col h-full relative isolate">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-[80] flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <button onClick={() => { soundService.playBoop(); setIsMobileMenuOpen(true); }}>
                <Menu className="text-slate-500 dark:text-slate-400" />
            </button>
            <span className="font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-sm">
                {currentView === 'path' ? 'Learning Path' : (selectedTopic && currentView === 'practice' ? selectedTopic.name : currentView)}
            </span>
            <div className="flex items-center gap-4">
              <button onClick={toggleDarkMode} className="text-slate-500 dark:text-slate-400">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
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
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] border-4 border-slate-200 dark:border-slate-800 shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center">
                          <Plus size={24} className="text-brand-green" />
                      </div>
                      <div>
                          <h2 className="text-2xl font-extrabold text-slate-700 dark:text-slate-200">New Module</h2>
                          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px]">What are we learning today?</p>
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
                              className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-brand-blue transition-all font-bold text-slate-700 dark:text-slate-200"
                          />
                      </div>
                      
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setIsTopicPromptOpen(false)}
                              className="flex-1 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={() => confirmNewTopic(newTopicName)}
                              className="flex-1 py-4 bg-brand-green text-white rounded-2xl font-bold shadow-[0_4px_0_#46A302] hover:translate-y-0.5 hover:shadow-none transition-all"
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
