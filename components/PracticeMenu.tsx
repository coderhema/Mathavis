import React from 'react';
import { motion } from 'motion/react';
import { Brain, Target, Zap, BookOpen, Trophy, Sparkles, Calculator, Shapes, ArrowRight } from 'lucide-react';
import { soundService } from '../services/soundService';

interface PracticeMode {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  xpBonus: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const MODES: PracticeMode[] = [
  {
    id: 'guided',
    title: 'Guided Learning',
    description: 'Step-by-step walkthroughs with Prof. Cluck.',
    icon: BookOpen,
    color: 'var(--blue)',
    xpBonus: '+10 XP',
    difficulty: 'Easy'
  },
  {
    id: 'quiz',
    title: 'Speed Quiz',
    description: 'Test your knowledge against the clock.',
    icon: Zap,
    color: 'var(--accent)',
    xpBonus: '+25 XP',
    difficulty: 'Medium'
  },
  {
    id: 'challenge',
    title: 'Daily Challenge',
    description: 'Tackle the hardest problems of the day.',
    icon: Target,
    color: 'var(--error)',
    xpBonus: '+50 XP',
    difficulty: 'Hard'
  },
  {
    id: 'free',
    title: 'Free Exploration',
    description: 'Ask anything and visualize complex concepts.',
    icon: Brain,
    color: 'var(--blue)',
    xpBonus: '+15 XP',
    difficulty: 'Easy'
  },
  {
    id: 'mental',
    title: 'Mental Math',
    description: 'Sharpen your speed with rapid-fire calculations.',
    icon: Calculator,
    color: 'var(--success)',
    xpBonus: '+20 XP',
    difficulty: 'Medium'
  },
  {
    id: 'visual',
    title: 'Visual Proofs',
    description: 'Understand theorems through geometric intuition.',
    icon: Shapes,
    color: 'var(--error)',
    xpBonus: '+30 XP',
    difficulty: 'Hard'
  }
];

interface PracticeMenuProps {
  onSelectMode: (modeId: string) => void;
}

const PracticeMenu: React.FC<PracticeMenuProps> = ({ onSelectMode }) => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto relative scrollbar-hide dark-transition" style={{ background: 'var(--bg2)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--blue)' }} />
            <span className="mono-label">Practice Lab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color: 'var(--text)' }}>
            Select a Training Protocol
          </h2>
          <p className="mono-hint text-sm">Choose your learning mode and begin</p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div
            className="flex-1 min-w-[140px] px-4 py-3 rounded-2xl border dark-transition"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <span className="mono-label block mb-1" style={{ fontSize: 9 }}>Global Rank</span>
            <span className="text-lg font-extrabold" style={{ color: 'var(--accent)' }}>#1,204</span>
          </div>
          <div
            className="flex-1 min-w-[140px] px-4 py-3 rounded-2xl border dark-transition"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
          >
            <span className="mono-label block mb-1" style={{ fontSize: 9 }}>Accuracy</span>
            <span className="text-lg font-extrabold" style={{ color: 'var(--success)' }}>94%</span>
          </div>
        </div>

        {/* Mode Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODES.map((mode, idx) => {
            const isFeatured = idx === 0;
            return (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundService.playBoop();
                  onSelectMode(mode.id);
                }}
                className={`
                  group relative rounded-2xl p-5 sm:p-6 text-left border-2 dark-transition
                  overflow-hidden transition-all
                `}
                style={{
                  background: 'var(--bg)',
                  borderColor: 'var(--border)',
                  ...(isFeatured ? { gridColumn: '1 / -1', smGridColumn: 'span 1' } : {}),
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-xl shrink-0"
                    style={{ background: mode.color, color: '#fff' }}
                  >
                    <mode.icon size={isFeatured ? 32 : 24} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-extrabold group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text)' }}>
                        {mode.title}
                      </h3>
                      <span className="mono-label" style={{ fontSize: 9 }}>{mode.difficulty}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text2)' }}>
                      {mode.description}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>{mode.xpBonus}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" style={{ color: 'var(--blue)' }}>
                        Start <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Progress Footer */}
        <div
          className="mt-8 p-5 sm:p-6 rounded-2xl border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden dark-transition"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--accent)' }} />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--blue-tint2)', color: 'var(--accent)' }}>
              <Trophy size={24} />
            </div>
            <div>
              <h4 className="text-base font-extrabold" style={{ color: 'var(--text)' }}>Weekly Protocol Progress</h4>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>Target: 5 sessions remaining for rank promotion</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
            <div className="flex-1 md:w-48 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
              <div className="h-full rounded-full" style={{ width: '60%', background: 'var(--accent)' }} />
            </div>
            <span className="text-sm font-extrabold" style={{ color: 'var(--accent)' }}>60%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeMenu;
