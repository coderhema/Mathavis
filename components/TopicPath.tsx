import React, { useRef, useEffect, useState } from 'react';
import { Divide, Sigma, Network, Grid, Lock, Trophy, Star, Plus, Sparkles } from 'lucide-react';
import { Topic } from '../types';
import { soundService } from '../services/soundService';
import { motion } from 'motion/react';

interface TopicPathProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  onNewModuleClick: () => void;
}

// SVG coordinate space width — path offsets are expressed in these units
const SVG_VIEWBOX_WIDTH = 600;
// Offset in SVG units; CSS pixel offset is computed proportionally at runtime
const SVG_NODE_OFFSET = 60;

const TopicPath: React.FC<TopicPathProps> = ({ topics, onSelectTopic, onNewModuleClick }) => {
  const handleTopicClick = (topic: Topic) => {
    soundService.playBoop();
    onSelectTopic(topic);
  };

  // Path configuration
  const nodeSpacing = 180;
  const startY = 100;

  // Track the rendered width of the SVG container so the CSS node offsets
  // scale exactly in sync with the SVG path at every viewport size.
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(SVG_VIEWBOX_WIDTH);

  useEffect(() => {
    const el = svgContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => obs.disconnect();
  }, []);

  // Pixel offset for nodes = SVG unit offset scaled to actual rendered pixels
  const nodeOffset = (containerWidth / SVG_VIEWBOX_WIDTH) * SVG_NODE_OFFSET;

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto relative dark-transition scrollbar-hide"
      style={{ background: 'var(--bg2)' }}
    >
        {/* Decorative floating math symbols */}
        <span className="math-float" style={{ top: '8%',  left: '4%'  }}>∑</span>
        <span className="math-float" style={{ top: '25%', right: '5%' }}>π²</span>
        <span className="math-float" style={{ top: '55%', left: '3%'  }}>∞</span>
        <span className="math-float" style={{ top: '72%', right: '6%' }}>√x</span>

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
                            <span className="mono-label opacity-80" style={{ color: 'rgba(255,255,255,0.8)' }}>Unit 1</span>
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
            <div ref={svgContainerRef} className="w-full relative" style={{ minHeight: (topics.length + 1) * nodeSpacing + startY }}>
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
                        d={generatePath(topics.length, nodeSpacing, SVG_NODE_OFFSET, startY)}
                        fill="none"
                        stroke="url(#pathGradient)"
                        strokeWidth="32"
                        strokeLinecap="round"
                        className="transition-colors duration-300"
                    />
                    
                    {/* Dashed Center Line */}
                    <path
                        d={generatePath(topics.length, nodeSpacing, SVG_NODE_OFFSET, startY)}
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
                        const x = isLeft ? -SVG_NODE_OFFSET : (isRight ? SVG_NODE_OFFSET : 0);
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
                                            shadow-[0_10px_0_rgba(0,0,0,0.15)] 
                                            relative z-10
                                            transition-all active:translate-y-[6px] active:shadow-[0_4px_0_rgba(0,0,0,0.15)]
                                            group-hover:brightness-110
                                        `}
                                        style={{ border: '4px solid var(--bg)' }}
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
                                            <div className="ds-card px-5 py-3 rounded-[24px] relative" style={{ minWidth: 160 }}>
                                                {/* Tooltip Arrow */}
                                                <div
                                                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rotate-45 rounded-sm"
                                                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderBottom: 'none', borderRight: 'none' }}
                                                />
                                                
                                                <div className="relative z-10 flex flex-col items-center gap-1">
                                                    <span className="font-black text-base uppercase tracking-wider" style={{ color: 'var(--text)' }}>{topic.name}</span>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star 
                                                                    key={i} 
                                                                    size={12} 
                                                                    className={i < Math.ceil((topic.completed || 0) / 20) ? "fill-brand-yellow text-brand-yellow" : ""}
                                                                    style={i < Math.ceil((topic.completed || 0) / 20) ? {} : { color: 'var(--border2)' }}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="mono-hint">
                                                            {topic.completed > 80 ? 'Popular' : 'Mastery'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="w-32 h-2 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg3)' }}>
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
                        <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center opacity-50"
                             style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                            <Lock size={32} style={{ color: 'var(--text3)' }} />
                        </div>
                        <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 mono-hint font-black text-xs uppercase tracking-widest">Locked</div>
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
