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
    color: 'bg-brand-blue',
    xpBonus: '+10 XP',
    difficulty: 'Easy'
  },
  {
    id: 'quiz',
    title: 'Speed Quiz',
    description: 'Test your knowledge against the clock.',
    icon: Zap,
    color: 'bg-brand-yellow',
    xpBonus: '+25 XP',
    difficulty: 'Medium'
  },
  {
    id: 'challenge',
    title: 'Daily Challenge',
    description: 'Tackle the hardest problems of the day.',
    icon: Target,
    color: 'bg-brand-red',
    xpBonus: '+50 XP',
    difficulty: 'Hard'
  },
  {
    id: 'free',
    title: 'Free Exploration',
    description: 'Ask anything and visualize complex concepts.',
    icon: Brain,
    color: 'bg-brand-purple',
    xpBonus: '+15 XP',
    difficulty: 'Easy'
  },
  {
    id: 'mental',
    title: 'Mental Math',
    description: 'Sharpen your speed with rapid-fire calculations.',
    icon: Calculator,
    color: 'bg-brand-green',
    xpBonus: '+20 XP',
    difficulty: 'Medium'
  },
  {
    id: 'visual',
    title: 'Visual Proofs',
    description: 'Understand theorems through geometric intuition.',
    icon: Shapes,
    color: 'bg-brand-red',
    xpBonus: '+30 XP',
    difficulty: 'Hard'
  }
];

interface PracticeMenuProps {
  onSelectMode: (modeId: string) => void;
}

const PracticeMenu: React.FC<PracticeMenuProps> = ({ onSelectMode }) => {
  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 dark-transition relative"
      style={{ background: 'var(--bg2)', color: 'var(--text)' }}
    >
      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(var(--blue) 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header row */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--blue)' }} />
              <span className="mono-label" style={{ color: 'var(--blue)' }}>System Status: Active</span>
            </div>
            <h2
              className="text-3xl sm:text-4xl font-black mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text)' }}
            >
              Practice Lab
            </h2>
            <p style={{ color: 'var(--text2)', fontWeight: 700 }}>Select a training protocol to begin</p>
          </div>

          <div className="flex flex-wrap gap-3 md:gap-4">
            <div
              className="min-w-[140px] flex-1 px-4 py-2 rounded-xl ds-card"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <span className="mono-label block mb-1">Global Rank</span>
              <span className="text-lg font-black" style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>#1,204</span>
            </div>
            <div
              className="min-w-[140px] flex-1 px-4 py-2 rounded-xl ds-card"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              <span className="mono-label block mb-1">Accuracy</span>
              <span className="text-lg font-black" style={{ color: 'var(--success)', fontFamily: "'Space Grotesk', sans-serif" }}>94%</span>
            </div>
          </div>
        </div>

        {/* Mode cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[200px]">
          {MODES.map((mode, idx) => {
            const isLarge = idx === 0;
            const isWide = idx === 2;

            return (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.01, translateY: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  soundService.playBoop();
                  onSelectMode(mode.id);
                }}
                className={`
                  group relative rounded-[20px] p-6 text-left transition-all overflow-hidden
                  ${isLarge ? 'md:row-span-2 md:col-span-1' : ''}
                  ${isWide ? 'md:col-span-2' : ''}
                `}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderBottom: '4px solid var(--border2)',
                  boxShadow: 'var(--shadow)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--blue)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
              >
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 ${mode.color} rounded-xl shadow-lg text-white`}>
                      <mode.icon size={isLarge ? 40 : 24} strokeWidth={2.5} />
                    </div>
                    <div className="text-right">
                      <div className="mono-label mb-1">{mode.difficulty}</div>
                      <div className="text-xs font-black" style={{ color: 'var(--success)', fontFamily: "'Space Grotesk', sans-serif" }}>{mode.xpBonus}</div>
                    </div>
                  </div>

                  <div>
                    <h3
                      className={`${isLarge ? 'text-3xl' : 'text-xl'} font-black mb-2 transition-colors`}
                      style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text)' }}
                    >
                      {mode.title}
                    </h3>
                    <p
                      className={`font-bold leading-relaxed ${isLarge ? 'text-base' : 'text-xs'}`}
                      style={{ color: 'var(--text2)' }}
                    >
                      {mode.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{ background: i <= (idx % 3 + 1) ? 'var(--blue)' : 'var(--dot)' }}
                        />
                      ))}
                    </div>
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mono-label"
                      style={{ color: 'var(--blue)' }}
                    >
                      Initialize <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Weekly progress footer */}
        <div
          className="mt-8 p-5 sm:p-6 rounded-[20px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 overflow-hidden relative"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderBottom: '4px solid var(--border2)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-[20px]" style={{ background: 'var(--accent)' }} />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--blue-tint2)', color: 'var(--accent)' }}>
              <Trophy size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text)' }}>Weekly Protocol Progress</h4>
              <p className="font-bold text-sm" style={{ color: 'var(--text2)' }}>Target: 5 sessions remaining for rank promotion</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
            <div className="flex-1 md:w-48 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg3)' }}>
              <div className="h-full w-[60%] rounded-full" style={{ background: 'var(--accent)' }} />
            </div>
            <span className="font-black text-sm" style={{ color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>60%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeMenu;
