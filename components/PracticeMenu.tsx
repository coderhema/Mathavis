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
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors duration-300 relative">
      {/* Technical Grid Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              <span className="text-brand-blue font-black uppercase tracking-[0.3em] text-[10px]">System Status: Active</span>
            </div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-1">Practice Lab</h2>
            <p className="text-slate-500 dark:text-slate-400 font-bold">Select a training protocol to begin</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm">
              <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Global Rank</span>
              <span className="text-lg font-black text-brand-yellow">#1,204</span>
            </div>
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-sm">
              <span className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Accuracy</span>
              <span className="text-lg font-black text-brand-green">94%</span>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[200px]">
          {MODES.map((mode, idx) => {
            // Different spans for bento effect
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
                  group relative rounded-[24px] p-6 text-left border-2 border-slate-200 dark:border-slate-800 
                  bg-white dark:bg-slate-900/80 backdrop-blur-sm shadow-xl transition-all overflow-hidden
                  hover:border-brand-blue/50 hover:bg-slate-100 dark:hover:bg-slate-800/50
                  ${isLarge ? 'md:row-span-2 md:col-span-1' : ''}
                  ${isWide ? 'md:col-span-2' : ''}
                `}
              >
                {/* Scanning Line Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-blue/5 to-transparent h-20 -translate-y-full pointer-events-none" />
                
                <div className="flex flex-col h-full justify-between relative z-10">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 ${mode.color} rounded-xl shadow-lg text-white`}>
                      <mode.icon size={isLarge ? 40 : 24} strokeWidth={2.5} />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{mode.difficulty}</div>
                      <div className="text-xs font-black text-brand-green">{mode.xpBonus}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className={`${isLarge ? 'text-3xl' : 'text-xl'} font-black text-slate-800 dark:text-white mb-2 group-hover:text-brand-blue transition-colors`}>
                      {mode.title}
                    </h3>
                    <p className={`text-slate-500 dark:text-slate-400 font-bold leading-relaxed ${isLarge ? 'text-base' : 'text-xs'}`}>
                      {mode.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-1 h-1 rounded-full ${i <= (idx % 3 + 1) ? 'bg-brand-blue' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-brand-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Initialize <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Status Footer */}
        <div className="mt-8 p-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-lg">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-brand-yellow/10 rounded-xl flex items-center justify-center text-brand-yellow">
              <Trophy size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800 dark:text-white">Weekly Protocol Progress</h4>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Target: 5 sessions remaining for rank promotion</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
            <div className="flex-1 md:w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-yellow w-[60%] rounded-full" />
            </div>
            <span className="text-brand-yellow font-black text-sm">60%</span>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(400%); }
        }
      `}</style>
    </div>
  );
};

export default PracticeMenu;
