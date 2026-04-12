import React from 'react';
import VoxelChicken from './VoxelChicken';
import { Sun, Moon } from 'lucide-react';
import { soundService } from '../services/soundService';

interface AuthPageProps {
  onLogin: () => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, isDarkMode, toggleDarkMode }) => {
  const handleLogin = () => {
    soundService.playBoop();
    onLogin();
  };

  const handleToggleTheme = () => {
    soundService.playBoop();
    if (toggleDarkMode) toggleDarkMode();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-300">
      <div className="absolute top-6 right-6">
        {toggleDarkMode && (
          <button 
            onClick={handleToggleTheme}
            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
      </div>

      <div className="mb-8 relative group cursor-pointer" onClick={handleLogin}>
        {/* Clean container without background effects */}
        <div className="w-32 h-32 bg-white dark:bg-slate-900 border-4 border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-center relative shadow-xl transform transition-transform group-hover:-translate-y-2 group-hover:rotate-6">
          <VoxelChicken size={90} emotion="happy" isAnimated={true} />
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-extrabold text-slate-700 dark:text-slate-200 mb-4 tracking-tight">
        MathLingo<br/>
        <span className="text-brand-green">Visual Learning</span>
      </h1>
      
      <p className="text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-md font-medium">
        Join <strong>Professor Cluck</strong> and master Calculus, Linear Algebra, and Graph Theory with blocks and fun!
      </p>

      <div className="space-y-4 w-full max-w-sm">
        <button 
            onClick={handleLogin}
            className="w-full py-4 rounded-2xl bg-brand-blue border-b-4 border-brand-blueDark text-white font-extrabold text-lg uppercase tracking-wider hover:bg-brand-blueDark hover:border-b-0 hover:translate-y-1 transition-all shadow-lg"
        >
            Get Started
        </button>
        
        <button 
            onClick={handleLogin}
            className="w-full py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 border-b-4 dark:border-b-slate-800 text-brand-blue font-extrabold text-lg uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 hover:translate-y-1 transition-all"
        >
            I have an account
        </button>
      </div>
    </div>
  );
};

export default AuthPage;