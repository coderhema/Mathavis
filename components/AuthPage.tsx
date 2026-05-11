import React, { useState, useEffect } from 'react';
import VoxelChicken from './VoxelChicken';
import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react';
import { soundService } from '../services/soundService';
import { ThemeToggle } from './ThemeToggle';

interface AuthPageProps {
  onLogin: () => void;
  isDarkMode?: boolean;
  toggleDarkMode?: (nextDark: boolean) => void;
}

interface FloatSymbol { top: string; sym: string; left?: string; right?: string; }
type AuthMode = 'login' | 'signup' | 'forgot' | 'otp';

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
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setChickenIn(true), 150);
    return () => clearTimeout(t);
  }, []);

  const resetStatus = () => setStatus('');

  const openMode = (next: AuthMode) => {
    soundService.playBoop();
    setMode(next);
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    resetStatus();
  };

  const openSubscription = () => {
    soundService.playBoop();
    window.history.pushState({}, '', '/subscription');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleLogin = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!email.trim() || !password.trim()) {
      setStatus('Enter your email and password.');
      return;
    }
    soundService.playBoop();
    onLogin();
  };

  const handleSignup = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setStatus('Fill all fields to continue.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }
    openMode('otp');
    setStatus('We sent a 6-digit code to your email.');
  };

  const handleForgot = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setStatus('Enter your email to receive an OTP.');
      return;
    }
    openMode('otp');
    setStatus('Password reset OTP sent.');
  };

  const handleOtpSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.trim().length !== 6) {
      setStatus('Enter a valid 6-digit OTP.');
      return;
    }
    soundService.playBoop();
    onLogin();
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
        <ThemeToggle 
          className="theme-toggle" 
          iconSize={16} 
          isDarkMode={isDarkMode || false}
          onToggle={toggleDarkMode || (() => {})} 
        />
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

      {/* Auth card */}
      <div className="w-full max-w-sm ds-card p-5 sm:p-6 step-in text-left">
        {(mode === 'forgot' || mode === 'otp' || mode === 'signup') && (
          <button
            onClick={() => openMode('login')}
            className="btn-ghost w-full mb-3"
            style={{ paddingTop: 10, paddingBottom: 10 }}
          >
            <ArrowLeft size={14} />
            Back to login
          </button>
        )}

        {mode === 'login' && (
          <form className="space-y-3" onSubmit={handleLogin}>
            <label className="mono-label block">Login</label>
            <input className="ds-input" placeholder="Email" type="email" value={email} onChange={e => { setEmail(e.target.value); resetStatus(); }} />
            <input className="ds-input" placeholder="Password" type="password" value={password} onChange={e => { setPassword(e.target.value); resetStatus(); }} />
            {status && <p className="mono-hint" style={{ color: 'var(--error)' }}>{status}</p>}
            <button type="submit" className="btn-cta w-full">Login</button>
            <button type="button" className="btn-ghost w-full" onClick={() => openMode('signup')}>Create account</button>
            <button type="button" className="btn-ghost w-full" onClick={() => openMode('forgot')}>Forgot password</button>
            <button type="button" className="btn-ghost w-full" onClick={openSubscription}>View subscription tiers</button>
          </form>
        )}

        {mode === 'signup' && (
          <form className="space-y-3" onSubmit={handleSignup}>
            <label className="mono-label block">Signup</label>
            <input className="ds-input" placeholder="Full name" value={name} onChange={e => { setName(e.target.value); resetStatus(); }} />
            <input className="ds-input" placeholder="Email" type="email" value={email} onChange={e => { setEmail(e.target.value); resetStatus(); }} />
            <input className="ds-input" placeholder="Password" type="password" value={password} onChange={e => { setPassword(e.target.value); resetStatus(); }} />
            <input className="ds-input" placeholder="Confirm password" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); resetStatus(); }} />
            {status && <p className="mono-hint" style={{ color: 'var(--error)' }}>{status}</p>}
            <button type="submit" className="btn-cta w-full">
              <MailCheck size={14} />
              Continue with OTP
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="space-y-3" onSubmit={handleForgot}>
            <label className="mono-label block">Forgot password</label>
            <input className="ds-input" placeholder="Email" type="email" value={email} onChange={e => { setEmail(e.target.value); resetStatus(); }} />
            {status && <p className="mono-hint" style={{ color: 'var(--error)' }}>{status}</p>}
            <button type="submit" className="btn-cta w-full">
              <MailCheck size={14} />
              Send OTP
            </button>
          </form>
        )}

        {mode === 'otp' && (
          <form className="space-y-3" onSubmit={handleOtpSubmit}>
            <label className="mono-label block">OTP Verification</label>
            <input className="ds-input" placeholder="6-digit code" value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); resetStatus(); }} />
            <p className="mono-hint">
              {status || 'Enter the code sent to your email.'}
            </p>
            <button type="submit" className="btn-cta w-full">
              <KeyRound size={14} />
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
