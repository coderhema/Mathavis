import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Mail, ShieldCheck, Sparkles, Users, Sun, Moon } from 'lucide-react';
import VoxelChicken from './VoxelChicken';
import { soundService } from '../services/soundService';

type Role = 'Parent' | 'Student' | 'Organization';
type AgeGroup = 'Under 13' | '13-17' | '18-24' | '25-34' | '35-44' | '45+';
type SubscriptionWillingness = 'Yes' | 'Maybe' | 'No';

const AGE_GROUPS: AgeGroup[] = ['Under 13', '13-17', '18-24', '25-34', '35-44', '45+'];
const ROLES: Role[] = ['Parent', 'Student', 'Organization'];
const WILLINGNESS_OPTIONS: SubscriptionWillingness[] = ['Yes', 'Maybe', 'No'];

const MATH_SYMBOLS = ['∑', 'π²', '∞', '√x', '∫', '∂', 'θ', 'λ', 'ε', 'Δ', '∇', 'φ'];
const CONFETTI_COLORS = ['#f59e0b', '#2563eb', '#ef4444', '#10b981', '#8b5cf6', '#f472b6', '#fbbf24'];

// Floating math symbol positions (irregular, never center-aligned)
const FLOAT_POSITIONS = [
  { top: '8%',  left: '6%',   symbol: '∑'  },
  { top: '14%', right: '9%',  symbol: 'π²' },
  { top: '32%', left: '4%',   symbol: '∞'  },
  { top: '55%', right: '7%',  symbol: '√x' },
  { top: '72%', left: '11%',  symbol: '∫'  },
  { top: '88%', right: '13%', symbol: '∂'  },
  { top: '22%', left: '18%',  symbol: 'θ'  },
  { top: '65%', right: '18%', symbol: 'λ'  },
  { top: '45%', left: '2%',   symbol: 'ε'  },
];

/* ── Confetti burst ─────────────────────────────────────────────────── */
interface Particle { id: number; color: string; tx: string; ty: string; rot: string; }

function makeConfetti(): Particle[] {
  return Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * 2 * Math.PI + Math.random() * 0.5;
    const dist  = 60 + Math.random() * 80;
    return {
      id:    i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      tx:    `${Math.cos(angle) * dist}px`,
      ty:    `${Math.sin(angle) * dist}px`,
      rot:   `${Math.random() * 720 - 360}deg`,
    };
  });
}

/* ── Multi-step form state ─────────────────────────────────────────── */
type Step = 0 | 1 | 2;   // 0 = identity, 1 = about, 2 = subscription

const Waitlist: React.FC = () => {
  const [step, setStep]         = useState<Step>(0);
  const [name, setName]         = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('');
  const [role, setRole]         = useState<Role | ''>('');
  const [email, setEmail]       = useState('');
  const [willingness, setWillingness] = useState<SubscriptionWillingness | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus]     = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [isDark, setIsDark]     = useState(() => document.documentElement.classList.contains('dark'));
  const [chickenIn, setChickenIn] = useState(false);
  const [confetti, setConfetti] = useState<Particle[]>([]);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  const waitlistEndpoint = import.meta.env.GOOGLE_SHEET_LINK as string | undefined;

  /* Chicken entrance on mount */
  useEffect(() => {
    const t = setTimeout(() => setChickenIn(true), 200);
    return () => clearTimeout(t);
  }, []);

  /* Dark mode sync */
  const toggleDark = () => {
    soundService.playBoop();
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('mathlingo_dark_mode', String(next));
  };

  const resetStatus = () => {
    if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
  };

  /* Step validation */
  const canAdvance = () => {
    if (step === 0) return name.trim().length > 0 && email.trim().length > 0;
    if (step === 1) return ageGroup !== '' && role !== '';
    return willingness !== '';
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    soundService.playBoop();
    setStep(prev => (prev < 2 ? (prev + 1) as Step : prev));
  };

  const handleBack = () => {
    soundService.playBoop();
    setStep(prev => (prev > 0 ? (prev - 1) as Step : prev));
  };

  /* Confetti burst */
  const burst = () => {
    setConfetti(makeConfetti());
    setTimeout(() => setConfetti([]), 1000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canAdvance()) return;
    soundService.playBoop();

    if (!waitlistEndpoint) {
      setStatus({ type: 'error', message: 'Waitlist endpoint is not configured yet. Add GOOGLE_SHEET_LINK in Vercel.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    const payload = { name: name.trim(), ageGroup, role, email: email.trim(), willingness, source: 'waitlist', submittedAt: new Date().toISOString() };

    try {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));
      await fetch(waitlistEndpoint, { method: 'POST', mode: 'no-cors', body: formData });

      setStatus({ type: 'success', message: "You're on the list! We'll be in touch soon." });
      setIsCelebrating(true);
      burst();
      setTimeout(() => setIsCelebrating(false), 750);
      setName(''); setAgeGroup(''); setRole(''); setEmail(''); setWillingness('');
      setStep(0);
    } catch {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Chip helper ─────────────────────────────────────────────────── */
  function ChipGroup<T extends string>({ options, value, onChange }: { options: T[]; value: T | ''; onChange: (v: T) => void }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => { soundService.playBoop(); onChange(opt); resetStatus(); }}
            className={`chip${value === opt ? ' selected' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  /* ── Progress dots ───────────────────────────────────────────────── */
  const ProgressDots = () => (
    <div className="flex items-center gap-2">
      {([0, 1, 2] as Step[]).map(s => (
        <div
          key={s}
          className={`prog-dot${s === step ? ' active' : s < step ? ' done' : ''}`}
        />
      ))}
    </div>
  );

  return (
    <div
      className="relative min-h-dvh w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden dark-transition"
      style={{ background: 'var(--bg2)' }}
    >
      {/* Floating math symbols */}
      {FLOAT_POSITIONS.map((p, i) => (
        <span
          key={i}
          className="math-float"
          style={{ top: p.top, left: (p as any).left, right: (p as any).right }}
        >
          {p.symbol}
        </span>
      ))}

      {/* Dark mode toggle — top right */}
      <button
        onClick={toggleDark}
        className="theme-toggle absolute top-5 right-5 z-20"
        aria-label="Toggle dark mode"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* ── Main card ──────────────────────────────────────────────── */}
      <div
        className="ds-card relative z-10 w-full flex flex-col sm:flex-row overflow-hidden step-in"
        style={{ maxWidth: 700 }}
      >
        {/* ── Mascot column ────────────────────────────────────────── */}
        <div
          className="flex flex-col items-center justify-end py-8 px-6 relative overflow-hidden shrink-0"
          style={{
            width: 118,
            minHeight: 280,
            background: 'var(--sidebg)',
            borderRight: '1px solid var(--border)',
          }}
        >
          {/* Ambient math symbols inside mascot panel */}
          <span className="math-float" style={{ top: '12%', left: '8px', fontSize: 11 }}>∫</span>
          <span className="math-float" style={{ top: '40%', right: '6px', fontSize: 10 }}>λ</span>
          <span className="math-float" style={{ bottom: '20%', left: '6px', fontSize: 11 }}>∂</span>

          <div className={`chicken-wrap${chickenIn ? ' in' : ''}`}>
            <VoxelChicken
              size={80}
              emotion={status.type === 'success' ? 'happy' : step === 1 ? 'thinking' : 'neutral'}
              isAnimated={true}
              isCelebrating={isCelebrating}
            />
          </div>
        </div>

        {/* ── Form column ──────────────────────────────────────────── */}
        <div className="flex-1 p-8 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
          {/* Confetti burst origin */}
          <div ref={confettiRef} className="absolute top-1/2 left-1/2 pointer-events-none z-50">
            {confetti.map(p => (
              <div
                key={p.id}
                className="confetti-particle"
                style={{ background: p.color, '--tx': p.tx, '--ty': p.ty, '--rot': p.rot } as React.CSSProperties}
              />
            ))}
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="mono-label mb-1">Early Access</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
                Join the Mathavis waitlist
              </h2>
            </div>
            <ProgressDots />
          </div>

          {/* Success state */}
          {status.type === 'success' ? (
            <div className="step-in flex flex-col items-center text-center gap-4 py-6">
              <div style={{ color: 'var(--success)', fontSize: 48 }}>✓</div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                You're on the list!
              </p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, color: 'var(--text2)' }}>
                {status.message}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {[
                  { icon: Users, label: 'Built for families and classrooms' },
                  { icon: ShieldCheck, label: 'Private & secure' },
                  { icon: Mail, label: 'Notified at launch' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                    <Icon size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ─ Step 0 : identity ──────────────────────────────── */}
              {step === 0 && (
                <div className="step-in space-y-4">
                  <div className="space-y-1">
                    <label className="mono-label block mb-1">Name</label>
                    <input
                      autoFocus
                      required
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value); resetStatus(); }}
                      placeholder="Your full name"
                      className="ds-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="mono-label block mb-1">Email</label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); resetStatus(); }}
                      placeholder="you@example.com"
                      className="ds-input"
                    />
                  </div>
                </div>
              )}

              {/* ─ Step 1 : about you ─────────────────────────────── */}
              {step === 1 && (
                <div className="step-in space-y-4">
                  <div className="space-y-2">
                    <label className="mono-label block">Age Group</label>
                    <ChipGroup options={AGE_GROUPS} value={ageGroup} onChange={v => setAgeGroup(v)} />
                  </div>
                  <div className="space-y-2">
                    <label className="mono-label block">I am a…</label>
                    <ChipGroup options={ROLES} value={role} onChange={v => setRole(v)} />
                  </div>
                </div>
              )}

              {/* ─ Step 2 : subscription ──────────────────────────── */}
              {step === 2 && (
                <div className="step-in space-y-4">
                  <div className="space-y-2">
                    <label className="mono-label block">Willing to pay a small monthly fee?</label>
                    <ChipGroup options={WILLINGNESS_OPTIONS} value={willingness} onChange={v => setWillingness(v)} />
                  </div>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'var(--text3)', lineHeight: 1.55 }}>
                    Helps us understand demand for premium features.
                  </p>
                </div>
              )}

              {/* Error message */}
              {status.type === 'error' && (
                <p
                  className="rounded-xl px-4 py-3 text-sm font-bold"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)', fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {status.message}
                </p>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 pt-1">
                {step > 0 && (
                  <button type="button" onClick={handleBack} className="btn-ghost flex-1">
                    Back
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canAdvance()}
                    className="btn-cta flex-1"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !canAdvance()}
                    className="btn-cta flex-1"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {isSubmitting ? 'Saving…' : 'Join waitlist'}
                  </button>
                )}
              </div>

              <p className="mono-hint">
                Submissions are sent to the URL stored in GOOGLE_SHEET_LINK.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Waitlist;
