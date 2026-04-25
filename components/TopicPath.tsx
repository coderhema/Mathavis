import React from 'react';
import { Divide, Sigma, Network, Grid, Lock, Trophy, Star, Plus, Sparkles } from 'lucide-react';
import { Topic } from '../types';
import { soundService } from '../services/soundService';
import { motion } from 'motion/react';

interface TopicPathProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  onNewModuleClick: () => void;
}

const TopicPath: React.FC<TopicPathProps> = ({ topics, onSelectTopic, onNewModuleClick }) => {
  const handleTopicClick = (topic: Topic) => {
    soundService.playBoop();
    onSelectTopic(topic);
  };

  // Path configuration
  const nodeSpacing = 180;
  const nodeOffset = 60;
  const startY = 100;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#f0f4f8] dark:bg-slate-950 relative transition-colors duration-300 scrollbar-hide">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-10">
            <div className="absolute top-20 left-[10%] w-32 h-32 bg-brand-green rounded-full blur-3xl" />
            <div className="absolute top-[40%] right-[10%] w-48 h-48 bg-brand-blue rounded-full blur-3xl" />
            <div className="absolute bottom-[20%] left-[15%] w-40 h-40 bg-brand-purple rounded-full blur-3xl" />
        </div>
        <div className="max-w-2xl mx-auto pt-10 sm:pt-16 pb-32 sm:pb-48 flex flex-col items-center relative">
            
            {/* Unit Header Card */}
            <div className="w-full px-6 mb-16 relative z-20">
                <div className="bg-brand-blue rounded-[32px] p-6 sm:p-8 shadow-[0_8px_0_#1a5fb4] text-white relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Trophy className="text-brand-yellow" size={20} />
                            </div>
                            <span className="font-black uppercase tracking-[0.2em] text-xs opacity-80">Unit 1</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black mb-2">Mathematical Foundations</h2>
                        <p className="text-blue-100 font-bold mb-6 text-sm sm:text-base">Master the building blocks of college math</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <button 
                                onClick={onNewModuleClick}
                                className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-brand-blue rounded-2xl font-black shadow-[0_4px_0_#e2e8f0] hover:translate-y-0.5 hover:shadow-none transition-all text-sm"
                            >
                                <Plus size={18} />
                                NEW MODULE
                            </button>
                            <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '45%' }}
                                    className="h-full bg-brand-yellow"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* The Journey Path */}
            <div className="w-full relative" style={{ minHeight: (topics.length + 1) * nodeSpacing + startY }}>
                {/* SVG Path Layer */}
                <svg 
                    className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible" 
                    viewBox={`-300 0 600 ${(topics.length + 1) * nodeSpacing + startY}`}
                    preserveAspectRatio="xMidYMin meet"
                    style={{ zIndex: 0 }}
                >
                    <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    
                    {/* Thick Base Path */}
                    <path
                        d={generatePath(topics.length, nodeSpacing, nodeOffset, startY)}
                        fill="none"
                        stroke="url(#pathGradient)"
                        strokeWidth="32"
                        strokeLinecap="round"
                        className="transition-colors duration-300"
                    />
                    
                    {/* Dashed Center Line */}
                    <path
                        d={generatePath(topics.length, nodeSpacing, nodeOffset, startY)}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="1 20"
                        className="dark:stroke-slate-800"
                    />

                    {/* Decorative Sparkles on the path */}
                    {[...Array(15)].map((_, i) => {
                        const t = i / 14;
                        const y = startY + t * topics.length * nodeSpacing;
                        const isLeft = Math.floor(t * topics.length) % 3 === 0;
                        const isRight = Math.floor(t * topics.length) % 3 === 2;
                        const x = isLeft ? -nodeOffset : (isRight ? nodeOffset : 0);
                        return (
                            <circle 
                                key={i}
                                cx={x + Math.sin(i) * 10}
                                cy={y}
                                r="2.5"
                                fill="#3b82f6"
                                className="animate-pulse opacity-30"
                            />
                        );
                    })}
                </svg>

                {/* Topic Nodes */}
                <div className="relative z-10 flex flex-col items-center">
                    {topics.map((topic, index) => {
                        const isLeft = index % 3 === 0;
                        const isRight = index % 3 === 2;
                        const xOffset = isLeft ? -nodeOffset : (isRight ? nodeOffset : 0);
                        
                        return (
                            <div 
                                key={topic.id}
                                className="relative flex flex-col items-center group/node hover:z-50"
                                style={{ 
                                    height: nodeSpacing,
                                    transform: `translateX(${xOffset}px)`,
                                    marginTop: index === 0 ? startY - 60 : 0
                                }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative group"
                                >
                                    {/* Node Shadow/Base */}
                                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/10 dark:bg-black/30 rounded-full blur-md transition-all group-hover:w-[90%] group-hover:blur-lg`} />
                                    
                                    {/* Main Button */}
                                    <button
                                        onClick={() => handleTopicClick(topic)}
                                        className={`
                                            w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-[28px] sm:rounded-[32px] 
                                            flex items-center justify-center 
                                            ${topic.color} 
                                            border-4 border-white dark:border-slate-900
                                            shadow-[0_10px_0_rgba(0,0,0,0.15)] 
                                            relative z-10
                                            transition-all active:translate-y-[6px] active:shadow-[0_4px_0_rgba(0,0,0,0.15)]
                                            group-hover:brightness-110
                                        `}
                                    >
                                        <div className="text-white drop-shadow-md">
                                            {topic.id === 'algebra' && <Grid size={36} strokeWidth={2.5} />}
                                            {topic.id === 'calc' && <Sigma size={36} strokeWidth={2.5} />}
                                            {topic.id === 'discrete' && <Divide size={36} strokeWidth={2.5} />}
                                            {topic.id === 'graph' && <Network size={36} strokeWidth={2.5} />}
                                            {topic.icon === 'plus' && <Plus size={36} strokeWidth={2.5} />}
                                        </div>

                                        {/* Completion Badge */}
                                        {topic.completed >= 100 && (
                                            <div className="absolute -top-3 -right-3 bg-brand-yellow text-white p-2 rounded-full border-4 border-white dark:border-slate-900 shadow-lg">
                                                <Sparkles size={16} fill="currentColor" />
                                            </div>
                                        )}
                                    </button>

                                    {/* Enhanced Tooltip Pop-up */}
                                    <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                                            <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-[24px] border-4 border-slate-200 dark:border-slate-800 shadow-2xl relative">
                                                {/* Tooltip Arrow */}
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-slate-900 border-t-4 border-l-4 border-slate-200 dark:border-slate-800 rotate-45 rounded-sm"></div>
                                                
                                                <div className="relative z-10 flex flex-col items-center gap-1">
                                                    <span className="font-black text-slate-700 dark:text-slate-200 text-base uppercase tracking-wider">{topic.name}</span>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    size={12} 
                                                                    className={i < Math.ceil((topic.completed || 0) / 20) ? "fill-brand-yellow text-brand-yellow" : "text-slate-200 dark:text-slate-700"} 
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                                                            {topic.completed > 80 ? 'Popular' : 'Mastery'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                                        <div 
                                                            className="h-full bg-brand-green transition-all duration-1000" 
                                                            style={{ width: `${topic.completed}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}

                    {/* Final Locked Milestone */}
                    <div className="mt-12 relative">
                        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center opacity-50">
                            <Lock size={32} className="text-slate-400" />
                        </div>
                        <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 text-slate-400 font-black text-xs uppercase tracking-widest">Locked</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// Helper to generate a winding path
function generatePath(count: number, spacing: number, offset: number, startY: number) {
    let d = "";
    for (let i = 0; i < count; i++) {
        const isLeft = i % 3 === 0;
        const isRight = i % 3 === 2;
        const x = isLeft ? -offset : (isRight ? offset : 0);
        const y = startY + i * spacing;

        if (i === 0) {
            d = `M ${x} ${y}`;
        } else {
            const prevI = i - 1;
            const prevIsLeft = prevI % 3 === 0;
            const prevIsRight = prevI % 3 === 2;
            const prevX = prevIsLeft ? -offset : (prevIsRight ? offset : 0);
            const prevY = startY + prevI * spacing;

            const cp1y = prevY + spacing * 0.5;
            const cp2y = y - spacing * 0.5;
            d += ` C ${prevX} ${cp1y}, ${x} ${cp2y}, ${x} ${y}`;
        }
    }
    
    // Add a tail
    const lastI = count - 1;
    const lastIsLeft = lastI % 3 === 0;
    const lastIsRight = lastI % 3 === 2;
    const lastX = lastIsLeft ? -offset : (lastIsRight ? offset : 0);
    const lastY = startY + lastI * spacing;
    d += ` C ${lastX} ${lastY + spacing * 0.5}, 0 ${lastY + spacing * 0.8}, 0 ${lastY + spacing}`;
    
    return d;
}

export default TopicPath;
