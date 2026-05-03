import React, { useState, useEffect } from 'react';
import VoxelChicken from './VoxelChicken';
import { Sun, Moon } from 'lucide-react';
import { soundService } from '../services/soundService';

interface AuthPageProps {
  onLogin: () => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

interface FloatSymbol { top: string; sym: string; left?: string; right?: string; }

const AUTH_FLOAT: FloatSymbol[] = [
  { top: '10%',  left: '5%',   sym: '∑' },
  { top: '20%',  right: '8%',  sym: 'π²' },
  { top: '50%',  left: '3%',   sym: '∞' },
  { top: '70%',  right: '6%',  sym: '√x' },
  { top: '85%',  left: '12%',  sym: 'θ' },
  { top: '35%',  right: '14%', sym: 'λ' },
];

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, isDarkMode, toggleDarkMode }) => {
  const [chickenIn, setChickenIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setChickenIn(true), 150);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = () => {
    soundService.playBoop();
    onLogin();
  };

  const handleToggleTheme = () => {
    soundService.playBoop();
    if (toggleDarkMode) toggleDarkMode();
  };

  return (
    <div
      className="relative min-h-dvh flex flex-col items-center justify-center p-6 text-center dark-transition overflow-hidden"
      style={{ background: 'var(--bg2)', fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {/* Floating math symbols */}
      {AUTH_FLOAT.map((p, i) => (
        <span
          key={i}
          className="math-float"
          style={{ top: p.top, left: p.left, right: p.right }}
        >
          {p.sym}
        </span>
      ))}

      {/* Theme toggle */}
      <div className="absolute top-5 right-5">
        {toggleDarkMode && (
          <button onClick={handleToggleTheme} className="theme-toggle">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </div>

      {/* Mascot */}
      <div
        className={`chicken-wrap mb-8 cursor-pointer group${chickenIn ? ' in' : ''}`}
        onClick={handleLogin}
      >
        <div
          className="w-32 h-32 flex items-center justify-center rounded-[28px] transform transition-transform group-hover:-translate-y-2 group-hover:rotate-3"
          style={{
            background: 'var(--bg)',
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <VoxelChicken size={90} emotion="happy" isAnimated={true} />
        </div>
      </div>

      {/* Title */}
      <h1
        className="mb-3 tracking-tight step-in"
        style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}
      >
        Mathavis
        <br />
        <span style={{ color: 'var(--blue)', fontSize: 28 }}>Visual Learning</span>
      </h1>

      <p
        className="mb-10 max-w-sm step-in"
        style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6 }}
      >
        Join <strong>Professor Cluck</strong> and master Calculus, Linear Algebra, and Graph Theory with blocks and fun!
      </p>

      {/* Buttons */}
      <div className="w-full max-w-xs space-y-3 step-in">
        <button onClick={handleLogin} className="btn-cta w-full">
          Get Started
        </button>

        <button
          onClick={handleLogin}
          className="btn-ghost w-full"
          style={{ color: 'var(--blue)', borderColor: 'var(--border2)' }}
        >
          I have an account
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
