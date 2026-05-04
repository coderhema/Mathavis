
import React, { useState, useRef, useEffect } from 'react';
import { Send, Eraser, Loader2, User, ArrowRight, Keyboard, X, Camera, Plus, Save, History, Trash2, Clock, Edit2, Check, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Message, VisualType, ChatSession } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { soundService } from '../services/soundService';
import { ttsService } from '../services/ttsService';
import PlotVis from './visualizations/PlotVis';
import Plot3DVis from './visualizations/Plot3DVis';
import GraphVis from './visualizations/GraphVis';
import FlowchartVis from './visualizations/FlowchartVis';
import MatrixVis from './visualizations/MatrixVis';
import Geometry3DVis from './visualizations/Geometry3DVis';
import StepByStepVis from './visualizations/StepByStepVis';
import { QuizVis } from './visualizations/QuizVis';
import VectorFieldVis from './visualizations/VectorFieldVis';
import UnitCircleVis from './visualizations/UnitCircleVis';
import ComplexPlaneVis from './visualizations/ComplexPlaneVis';
import VennDiagramVis from './visualizations/VennDiagramVis';
import BentoVis from './visualizations/BentoVis';
import TreeVis from './visualizations/TreeVis';
import ParticleVis from './visualizations/ParticleVis';
import MathKeyboard from './MathKeyboard';
import VoxelChicken from './VoxelChicken';

declare global {
  interface Window {
    katex: any;
  }
}

interface WhiteboardProps {
  initialTopic?: string;
  onXPChange?: (amount: number) => void;
  sessionTrigger?: number;
  initialHistoryOpen?: boolean;
  onNewModuleClick: () => void;
  practiceMode?: string | null;
  onBackToMenu?: () => void;
}

const MATH_KEYWORDS = [
  'Derivative', 'Integral', 'Limit', 'Matrix', 'Vector', 'Eigenvector', 'Eigenvalue',
  'Determinant', 'Inverse', 'Linear Algebra', 'Calculus', 'Function', 'Graph', 
  'Discrete Math', 'Set Theory', 'Combinatorics', 'Probability', 'Statistics',
  'Logarithm', 'Exponential', 'Trigonometry', 'Sine', 'Cosine', 'Tangent',
  'Gradient', 'Divergence', 'Curl', 'Manifold', 'Topology', 'Equation',
  'Subspace', 'Basis', 'Dimension', 'Rank', 'Nullspace', 'Transformation',
  'Convergence', 'Divergence', 'Series', 'Sequence', 'Continuity', 'Taylor',
  'Fourier', 'Laplace', 'Differential', 'Partial', 'Chain Rule'
];

const MathRenderer: React.FC<{ tex: string; displayMode?: boolean }> = ({ tex, displayMode = false }) => {
  const html = React.useMemo(() => {
    try {
      if (window.katex) {
        return window.katex.renderToString(tex, {
          displayMode,
          throwOnError: false,
        });
      }
      return tex;
    } catch (e) {
      console.error("KaTeX Error:", e);
      return tex;
    }
  }, [tex, displayMode]);

  return <span className={displayMode ? "block my-4 overflow-x-auto scrollbar-hide py-2" : "inline-block"} dangerouslySetInnerHTML={{ __html: html }} />;
};

const FormattedText: React.FC<{ text: string; highlightIndex?: number }> = ({ text, highlightIndex = -1 }) => {
  const keywordPattern = MATH_KEYWORDS.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  // Use a single capturing group for the entire match to avoid undefined parts in split()
  const regex = new RegExp(`(\\$\\$[\\s\\S]*?\\$\\$|\\$.*?\\$|\\*\\*.*?\\*\\*|\\b(?:${keywordPattern})\\b)`, 'gi');
  
  // Split the text into sentences for TTS highlighting
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  
  return (
    <div className="whitespace-pre-wrap">
      {sentences.map((sentence, sIdx) => {
        const parts = sentence.split(regex);
        const isHighlighted = sIdx === highlightIndex;
        
        return (
          <span key={sIdx} className={isHighlighted ? "bg-brand-blue/20 dark:bg-brand-blue/40 rounded px-1 transition-colors duration-300" : ""}>
            {parts.map((part, i) => {
              if (!part) return null;
              
              // LaTeX Display Mode
              if (part.startsWith('$$') && part.endsWith('$$')) {
                return <MathRenderer key={i} tex={part.slice(2, -2)} displayMode={true} />;
              }
              
              // LaTeX Inline Mode
              if (part.startsWith('$') && part.endsWith('$')) {
                return <MathRenderer key={i} tex={part.slice(1, -1)} />;
              }
              
              // Bold Text
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-brand-blue font-extrabold">{part.slice(2, -2)}</strong>;
              }
              
              // Keywords
              const isKeyword = MATH_KEYWORDS.some(k => k.toLowerCase() === part.toLowerCase());
              if (isKeyword) {
                return (
                  <span key={i} className="px-1 py-0.5 rounded bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue font-bold decoration-brand-blue/30 underline-offset-4 decoration-2">
                    {part}
                  </span>
                );
              }
              
              return <span key={i}>{part}</span>;
            })}
          </span>
        );
      })}
    </div>
  );
};

const SESSIONS_STORAGE_KEY = 'mathlingo_all_sessions';

const Whiteboard: React.FC<WhiteboardProps> = ({ 
  initialTopic, 
  onXPChange, 
  sessionTrigger, 
  initialHistoryOpen, 
  onNewModuleClick,
  practiceMode,
  onBackToMenu
}) => {
  const getInitialMessage = (topic?: string): Message => {
    let welcomeText = "Hi! I'm **Professor Cluck**. I can visualize anything from 3D surfaces to matrix transforms. What should we explore?";
    
    if (practiceMode === 'quiz') {
        welcomeText = "Cluck cluck! Ready for a **Speed Quiz**? I'll throw some quick math challenges at you. Ready?";
    } else if (practiceMode === 'guided') {
        welcomeText = "Let's start a **Guided Learning** session. Pick a topic, and I'll walk you through it step-by-step!";
    } else if (practiceMode === 'challenge') {
        welcomeText = "Feeling brave? This is the **Daily Challenge**. I've prepared a tough problem for you!";
    } else if (practiceMode === 'mental') {
        welcomeText = "Time for some **Mental Math**! No calculators allowed—just your brain and my clucks. Let's go!";
    } else if (practiceMode === 'visual') {
        welcomeText = "Let's explore **Visual Proofs**. I'll show you how geometry makes math beautiful and intuitive.";
    } else if (topic) {
        welcomeText = `Cluck cluck! Ready to dive back into **${topic}**? Let's crack some problems!`;
    }

    return {
        id: 'welcome-' + Date.now(),
        role: 'model',
        text: welcomeText,
        timestamp: Date.now(),
        visual: { type: VisualType.NONE },
        suggestedActions: practiceMode === 'quiz' 
            ? ["Start Quiz", "Algebra Quiz", "Calculus Quiz"]
            : (topic ? [`Explain ${topic} basics`, `Show me a ${topic} plot`, "Give me a quiz"] : ["Plot 3D Surface", "Linear Transformations", "Graph Algorithms", "Calculate Integrals"])
    };
  };

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
        const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) { console.error("Sessions load error:", e); }
    
    // Create first session if none exists
    const firstSession: ChatSession = {
        id: 'session-' + Date.now(),
        title: initialTopic || 'New Math Session',
        messages: [getInitialMessage(initialTopic)],
        updatedAt: Date.now()
    };
    return [firstSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(sessions[0].id);
  const [inputText, setInputText] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(initialHistoryOpen || false);
  const [isReading, setIsReading] = useState(false);
  const [readingSentenceIndex, setReadingSentenceIndex] = useState(-1);

  const stopReading = () => {
    ttsService.stop();
    setIsReading(false);
    setReadingSentenceIndex(-1);
  };

  const handleRead = async (text: string) => {
    if (isReading) {
      stopReading();
      return;
    }

    // Clean text for TTS (remove LaTeX markers)
    const cleanText = text.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$.*?\$/g, '').replace(/\*\*/g, '');
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];

    setIsReading(true);
    setReadingSentenceIndex(0); // For now, just highlight the whole block or first sentence

    try {
      await ttsService.speak(cleanText);
    } finally {
      setIsReading(false);
      setReadingSentenceIndex(-1);
    }
  };

  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState(false);
  const [expandedArtifact, setExpandedArtifact] = useState<Message | null>(null);
  const [lastTrigger, setLastTrigger] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  // Persistence Effect
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
        setIsSaving(false);
    }, 500);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    return () => clearTimeout(timer);
  }, [sessions]);

  const handleSend = async (text: string, image?: string | null) => {
    if ((!text.trim() && !image) || isLoading) return;
    
    soundService.playBoop();
    
    const userMsg: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: text || "Help me with this!", 
        image: image || undefined,
        timestamp: Date.now() 
    };
    
    // Update local session state
    setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
            let newTitle = s.title;
            // Set title based on first user message if it's currently generic
            if (s.messages.length === 1 && text) {
                newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
            }
            return {
                ...s,
                title: newTitle,
                messages: [...s.messages, userMsg],
                updatedAt: Date.now()
            };
        }
        return s;
    }));

    setInputText('');
    setCapturedImage(null);
    setShowKeyboard(false);
    setIsLoading(true);

    try {
        const responseMsg = await sendMessageToGemini(messages, userMsg.text, image || undefined); 
        
        soundService.playCluck();

        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return {
                    ...s,
                    messages: [...s.messages, responseMsg],
                    updatedAt: Date.now()
                };
            }
            return s;
        }));

        if (onXPChange) onXPChange(image ? 25 : 10);
    } catch (e) { 
        console.error(e);
        const errMsg: Message = {
            id: 'err-' + Date.now(),
            role: 'model',
            text: "Oops! My feathers got ruffled. Try again?",
            timestamp: Date.now(),
            visual: { type: VisualType.NONE },
            suggestedActions: ["Try again"]
        };
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return { ...s, messages: [...s.messages, errMsg], updatedAt: Date.now() };
            }
            return s;
        }));
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleNewChat = () => {
    soundService.playBoop();
    onNewModuleClick();
    setIsHistoryOpen(false);
  };

  const confirmNewChat = (topic: string) => {
    const newSession: ChatSession = {
        id: 'session-' + Date.now(),
        title: topic || 'New Math Session',
        messages: [getInitialMessage(topic)],
        updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    
    // If a topic was provided, automatically send an initial query
    if (topic.trim()) {
        setTimeout(() => {
            handleSend(`Tell me about ${topic}`);
        }, 500);
    }
  };

  // Session Trigger Effect
  useEffect(() => {
    if (sessionTrigger !== undefined && sessionTrigger > lastTrigger) {
      confirmNewChat(initialTopic || 'New Math Session');
      setLastTrigger(sessionTrigger);
    }
  }, [sessionTrigger, lastTrigger, initialTopic]);

  // Initial History Open Effect
  useEffect(() => {
    if (initialHistoryOpen) {
      setIsHistoryOpen(true);
    }
  }, [initialHistoryOpen]);

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
        handleClearCurrentHistory();
        return;
    }
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
        setCurrentSessionId(newSessions[0].id);
    }
  };

  const renameSession = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s));
    setEditingSessionId(null);
    soundService.playBoop();
  };

  const handleClearCurrentHistory = () => {
    soundService.playBoop();
    if (window.confirm("Clear this conversation?")) {
        setSessions(prev => prev.map(s => {
            if (s.id === currentSessionId) {
                return {
                    ...s,
                    title: 'New Math Session',
                    messages: [getInitialMessage(initialTopic)],
                    updatedAt: Date.now()
                };
            }
            return s;
        }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              if (file.type === 'application/pdf') {
                  setCapturedImage('data:application/pdf;base64,' + base64.split(',')[1]);
              } else {
                  setCapturedImage(base64);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const currentSuggestedActions = [...messages].reverse().find(m => m.role === 'model')?.suggestedActions || [];

  return (
    <div className="flex min-h-0 flex-col h-full w-full min-w-0 relative isolate overflow-x-hidden dark-transition" style={{ background: 'var(--bg2)' }}>
        {/* History Drawer Overlay */}
        {isHistoryOpen && (
            <div 
                className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsHistoryOpen(false)}
            >
                <div 
                    className="absolute left-0 top-0 bottom-0 w-[calc(100vw-1rem)] max-w-80 sm:w-80 shadow-2xl p-4 sm:p-6 flex flex-col overflow-y-auto overflow-x-hidden animate-in slide-in-from-left duration-300" style={{ background: 'var(--bg)', borderRight: '1.5px solid var(--border)' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <History className="text-brand-blue" size={24} />
                            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>Math Coop</h2>
                        </div>
                        <button onClick={() => { soundService.playBoop(); setIsHistoryOpen(false); }} className="p-2 transition-colors" style={{ color: 'var(--text3)' }}>
                            <X size={24} />
                        </button>
                    </div>

                    <button 
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 py-4 mb-6 bg-brand-green text-white rounded-2xl font-bold shadow-[0_4px_0_#46A302] hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                        <Plus size={20} />
                        New Module
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-2">
                        <p className="mono-label mb-2 px-1">Recent Sessions</p>
                        {sessions.map(session => (
                            <div 
                                key={session.id}
                                onClick={() => { soundService.playBoop(); setCurrentSessionId(session.id); setIsHistoryOpen(false); }}
                                className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                    session.id === currentSessionId 
                                    ? 'border-brand-blue' 
                                    : 'hover:border-[var(--border2)]'
                                }`}
                                style={{ background: 'var(--bg)', borderColor: session.id === currentSessionId ? undefined : 'var(--border)' }}
                            >
                                <div className="flex-1 min-w-0 pr-2">
                                    {editingSessionId === session.id ? (
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                            <input 
                                                autoFocus
                                                value={editingTitle}
                                                onChange={e => setEditingTitle(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') renameSession(session.id, editingTitle);
                                                    if (e.key === 'Escape') setEditingSessionId(null);
                                                }}
                                                className="ds-input text-sm py-1"
                                            />
                                            <button 
                                                onClick={() => { soundService.playBoop(); renameSession(session.id, editingTitle); }}
                                                className="p-1.5 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                                            >
                                                <Check size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className={`font-bold truncate text-sm`} style={{ color: session.id === currentSessionId ? 'var(--blue)' : 'var(--text)' }}>
                                                {session.title}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 mono-hint">
                                                <Clock size={10} />
                                                {new Date(session.updatedAt).toLocaleDateString()}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            soundService.playBoop(); 
                                            setEditingSessionId(session.id); 
                                            setEditingTitle(session.title); 
                                        }}
                                        className="p-2.5 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text3)' }}
                                        title="Rename"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => { soundService.playBoop(); deleteSession(e, session.id); }}
                                        className="p-2.5 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100" style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text3)' }}
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Toolbar Header */}
        <div className="sticky top-0 z-[80] w-full min-w-0 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md" style={{ borderBottom: '1.5px solid var(--border)', background: 'var(--bg-glass, var(--bg))' }}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                {onBackToMenu && (
                    <button 
                        onClick={() => { soundService.playBoop(); onBackToMenu(); }}
                        className="p-3 rounded-2xl transition-all shadow-sm flex items-center gap-2" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text3)' }}
                        title="Back to Menu"
                    >
                        <ArrowRight size={20} className="rotate-180" />
                        <span className="hidden md:inline font-bold text-sm">Menu</span>
                    </button>
                )}
                <button 
                    onClick={() => { soundService.playBoop(); setIsHistoryOpen(true); }}
                    className="p-3 rounded-2xl transition-all shadow-sm" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text3)' }}
                    title="History"
                >
                    <History size={20} />
                </button>
                <div className="h-8 w-[2px] mx-1" style={{ background: 'var(--border)' }} />
                <button 
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-xl font-bold shadow-[0_3px_0_#46A302] hover:translate-y-0.5 hover:shadow-none transition-all text-sm"
                >
                    <Plus size={18} />
                    New Chat
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2" style={{ color: 'var(--text3)' }}>
                    {isSaving ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest animate-pulse text-brand-blue">
                            <Save size={12} /> Syncing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest opacity-40">
                            Saved
                        </span>
                    )}
                </div>
                <button 
                    onClick={handleClearCurrentHistory}
                    className="p-2 transition-colors" style={{ color: 'var(--text3)' }}
                    title="Clear current session"
                >
                    <Eraser size={20} />
                </button>
            </div>
        </div>

        {/* Chat Area */}
        <div className={`relative z-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 pb-44 sm:pb-48 scrollbar-hide transition-all duration-300 ${showKeyboard ? 'pb-[320px]' : ''}`}>
            <div className="max-w-4xl mx-auto w-full min-w-0 space-y-8">
                {messages.map((msg, index) => (
                    <div key={msg.id} className={`flex w-full min-w-0 flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                        <div className={`flex items-end gap-2 mb-2 px-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            {msg.role === 'model' && (
                                <div className="mb-[-10px] z-10">
                                    <VoxelChicken 
                                        size={50} 
                                        isAnimated={true} 
                                        isSpeaking={false} 
                                        emotion="happy"
                                    />
                                </div>
                            )}
                            {msg.role === 'user' && <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2" style={{ background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', color: '#6366f1' }}><User size={20} /></div>}
                            <span className="mono-label mb-2">{msg.role === 'user' ? 'You' : 'Prof. Cluck'}</span>
                        </div>

                        <div
                            className={`w-full max-w-full sm:max-w-[85%] min-w-0 break-words p-4 sm:p-5 rounded-3xl shadow-sm text-base sm:text-lg leading-relaxed border-b-4 relative transition-colors ${msg.role === 'user' ? 'bg-indigo-500 text-white border-indigo-700 rounded-tr-sm' : 'rounded-tl-sm ml-0 sm:ml-4'}`}
                            style={msg.role === 'model' ? { background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' } : {}}
                        >
                            {msg.image && (
                                <div className="mb-4 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
                                    <img src={msg.image} alt="Submitted math" className="w-full h-auto object-contain max-h-[300px]" />
                                </div>
                            )}
                            <FormattedText text={msg.text} />
                        </div>

                        {msg.visual && msg.visual.type !== VisualType.NONE && (
                            <div className="mt-4 ml-0 sm:ml-4 w-full max-w-full sm:max-w-2xl min-w-0 p-2 rounded-3xl overflow-hidden relative group" style={{ background: 'var(--bg)', borderBottom: '4px solid var(--border)', boxShadow: '0 8px 0 var(--border)' }}>
                                <button 
                                    onClick={() => { soundService.playBoop(); setExpandedArtifact(msg); }}
                                    className="absolute top-4 right-4 z-20 p-2 backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110" style={{ background: 'var(--bg-glass, var(--bg))', border: '1px solid var(--border)' }}
                                    title="Expand"
                                >
                                    <Maximize2 size={20} className="text-brand-blue" />
                                </button>
                                <div className="h-[350px] md:h-[500px] w-full relative">
                                    {msg.visual.type === VisualType.PLOT && msg.visual.plotData && <PlotVis data={msg.visual.plotData} />}
                                    {msg.visual.type === VisualType.PLOT3D && msg.visual.plot3DData && (
                                        <>
                                            <Plot3DVis data={msg.visual.plot3DData} />
                                            {msg.visual.plotData && (
                                                <div className="absolute top-4 right-4 w-24 h-24 md:w-32 md:h-32 z-20 rounded-2xl shadow-xl overflow-hidden pointer-events-auto" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                                    <div className="absolute top-1 left-2 text-[8px] font-bold text-slate-400 uppercase tracking-tighter z-10">2D Preview</div>
                                                    <PlotVis data={msg.visual.plotData} isPreview={true} />
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {msg.visual.type === VisualType.GEOMETRY3D && msg.visual.geometry3DData && (
                                        <>
                                            <Geometry3DVis data={msg.visual.geometry3DData} />
                                            {msg.visual.plotData && (
                                                <div className="absolute top-4 right-4 w-24 h-24 md:w-32 md:h-32 z-20 bg-white/90 dark:bg-slate-800/90 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden pointer-events-auto">
                                                    <div className="absolute top-1 left-2 text-[8px] font-bold text-slate-400 uppercase tracking-tighter z-10">2D Preview</div>
                                                    <PlotVis data={msg.visual.plotData} isPreview={true} />
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {msg.visual.type === VisualType.GRAPH && msg.visual.graphData && <GraphVis data={msg.visual.graphData} />}
                                    {msg.visual.type === VisualType.FLOWCHART && msg.visual.flowchartData && <FlowchartVis data={msg.visual.flowchartData} />}
                                    {msg.visual.type === VisualType.MATRIX && msg.visual.matrixData && <div className="h-full flex items-center justify-center"><MatrixVis data={msg.visual.matrixData} /></div>}
                                    {msg.visual.type === VisualType.VECTOR_FIELD && msg.visual.vectorFieldData && <VectorFieldVis data={msg.visual.vectorFieldData} />}
                                    {msg.visual.type === VisualType.UNIT_CIRCLE && msg.visual.unitCircleData && <UnitCircleVis data={msg.visual.unitCircleData} />}
                                    {msg.visual.type === VisualType.COMPLEX_PLANE && msg.visual.complexPlaneData && <ComplexPlaneVis data={msg.visual.complexPlaneData} />}
                                    {msg.visual.type === VisualType.VENN_DIAGRAM && msg.visual.vennDiagramData && <VennDiagramVis data={msg.visual.vennDiagramData} />}
                                    {msg.visual.type === VisualType.BENTO && msg.visual.bentoData && <BentoVis data={msg.visual.bentoData} />}
                                    {msg.visual.type === VisualType.TREE && msg.visual.treeData && <TreeVis data={msg.visual.treeData} />}
                                    {msg.visual.type === VisualType.PARTICLE && msg.visual.particleData && <ParticleVis data={msg.visual.particleData} />}
                                    {msg.visual.type === VisualType.QUIZ && msg.visual.quizData && <QuizVis data={msg.visual.quizData} />}
                                    {msg.visual.type === VisualType.STEPS && msg.visual.stepByStepData && <StepByStepVis data={msg.visual.stepByStepData} />}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex flex-col items-start gap-2 animate-pulse">
                         <div className="flex items-end gap-2 px-1">
                             <div className="mb-[-10px] z-10">
                                 <VoxelChicken size={50} emotion="thinking" isAnimated={true} isSpeaking={false} />
                             </div>
                             <span className="mono-label mb-2">Thinking...</span>
                         </div>
                        <div className="p-4 rounded-3xl rounded-tl-sm shadow-sm ml-4" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)' }}><Loader2 className="animate-spin text-brand-green" size={24} /></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>

        {/* Input Dock */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col">
            <div className="h-12 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--bg2), transparent)' }} />
            
            {capturedImage && (
                <div className="max-w-4xl mx-auto w-full min-w-0 px-4 mb-2 animate-in slide-in-from-bottom-2">
                    <div className="p-2 rounded-2xl border-2 border-brand-blue flex items-center gap-3 shadow-lg" style={{ background: 'var(--bg)' }}>
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 relative group flex items-center justify-center" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                            {capturedImage.startsWith('data:application/pdf') ? (
                                <div className="flex flex-col items-center justify-center">
                                    <Save size={24} className="text-brand-red" />
                                    <span className="text-[8px] font-bold mt-1">PDF</span>
                                </div>
                            ) : (
                                <img src={capturedImage} className="w-full h-full object-cover" />
                            )}
                            <button 
                                onClick={() => { soundService.playBoop(); setCapturedImage(null); }} 
                                className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-xs font-bold" style={{ color: 'var(--text2)' }}>
                            {capturedImage.startsWith('data:application/pdf') ? 'PDF attached for practice. Professor Cluck will tailor the session!' : 'Math photo attached. What should Professor Cluck do with it?'}
                        </p>
                    </div>
                </div>
            )}

            <div className="backdrop-blur-md pb-2 pt-2 px-4 overflow-x-hidden" style={{ background: 'var(--bg3)', borderTop: '1.5px solid var(--border)' }}>
                <div className="max-w-4xl mx-auto w-full min-w-0 flex flex-col gap-3">
                    {!isLoading && !showKeyboard && currentSuggestedActions.length > 0 && (
                        <div className="flex flex-col gap-2 mb-2">
                            <div className="flex items-center justify-between px-2">
                                <span className="mono-label">Suggestions</span>
                                <button 
                                    onClick={() => { soundService.playBoop(); setIsSuggestionsCollapsed(!isSuggestionsCollapsed); }}
                                    className="mono-label hover:underline" style={{ color: 'var(--blue)' }}
                                >
                                    {isSuggestionsCollapsed ? 'Show' : 'Hide'}
                                </button>
                            </div>
                            {!isSuggestionsCollapsed && (
                                <div className="flex overflow-x-auto pb-3 gap-2 scrollbar-hide md:flex-wrap md:justify-start animate-in fade-in slide-in-from-bottom-1 -mx-4 px-4 md:mx-0 md:px-0">
                                    {currentSuggestedActions.map((action, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleSend(action)} 
                                            className="chip whitespace-nowrap text-sm flex items-center gap-2 group shrink-0 hover:translate-y-1 transition-all"
                                        >
                                            {action} <ArrowRight size={16} className="opacity-0 md:group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-2 md:gap-3 pb-4">
                        <button 
                            className="p-2.5 md:p-3 rounded-2xl transition-colors" style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text3)' }} 
                            title="Snap Math" 
                            onClick={() => { soundService.playBoop(); fileInputRef.current?.click(); }}
                        >
                            <Camera size={20} />
                            <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                        </button>

                        <div className="flex-1 relative">
                            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText, capturedImage)} placeholder="Ask Prof. Cluck..." disabled={isLoading} className="ds-input w-full p-3 md:p-4 pr-10 md:pr-12 text-sm md:text-base" />
                            <button 
                                onClick={() => {
                                    soundService.playBoop();
                                    setShowKeyboard(!showKeyboard);
                                }} 
                                className={`absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 p-1.5 md:p-2 rounded-xl transition-colors ${showKeyboard ? 'text-brand-blue' : ''}`} style={{ color: showKeyboard ? 'var(--blue)' : 'var(--text3)' }}
                            >
                                {showKeyboard ? <X size={18} /> : <Keyboard size={18} />}
                            </button>
                        </div>
                        
                        <button onClick={() => handleSend(inputText, capturedImage)} disabled={(!inputText.trim() && !capturedImage) || isLoading} className={`p-3 md:p-4 rounded-2xl transition-all ${(inputText.trim() || capturedImage) && !isLoading ? 'bg-brand-green text-white shadow-[0_4px_0_#46A302] hover:translate-y-1 hover:shadow-none' : 'cursor-not-allowed opacity-40'}`} style={(inputText.trim() || capturedImage) && !isLoading ? {} : { background: 'var(--bg3)' }}><Send size={20} /></button>
                    </div>
                </div>
            </div>
            <MathKeyboard isOpen={showKeyboard} onInsert={(s) => setInputText(p => p + s)} onDelete={() => setInputText(p => p.slice(0, -1))} onEnter={() => handleSend(inputText, capturedImage)} />
        </div>

        {/* Artifact Expansion Modal */}
        {expandedArtifact && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-12 animate-in fade-in duration-300" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}>
                <div className="ds-card w-full h-full max-w-6xl rounded-[32px] sm:rounded-[40px] flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide relative">
                    <button 
                        onClick={() => { soundService.playBoop(); setExpandedArtifact(null); }}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[110] p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shadow-lg" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}
                    >
                        <X size={24} className="sm:w-8 sm:h-8" />
                    </button>
                    
                    <div className="p-6 sm:p-8 flex items-center gap-4 shrink-0" style={{ borderBottom: '1.5px solid var(--border)' }}>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.1)' }}>
                            <Maximize2 size={20} className="sm:w-6 sm:h-6 text-brand-blue" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text)' }}>Interactive Visualization</h2>
                            <p className="mono-label">Full Screen Mode</p>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-[600px] relative" style={{ background: 'var(--bg2)' }}>
                        {expandedArtifact.visual?.type === VisualType.PLOT && expandedArtifact.visual.plotData && <PlotVis data={expandedArtifact.visual.plotData} />}
                        {expandedArtifact.visual?.type === VisualType.PLOT3D && expandedArtifact.visual.plot3DData && (
                            <>
                                {expandedArtifact.visual.plotData ? (
                                    <>
                                        <PlotVis data={expandedArtifact.visual.plotData} />
                                        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-24 h-24 sm:w-40 sm:h-40 z-20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                            <div className="absolute top-1 left-2 sm:top-2 sm:left-3 mono-label z-10">3D View</div>
                                            <Plot3DVis data={expandedArtifact.visual.plot3DData} isStatic={true} />
                                        </div>
                                    </>
                                ) : (
                                    <Plot3DVis data={expandedArtifact.visual.plot3DData} />
                                )}
                            </>
                        )}
                        {expandedArtifact.visual?.type === VisualType.GEOMETRY3D && expandedArtifact.visual.geometry3DData && (
                            <>
                                {expandedArtifact.visual.plotData ? (
                                    <>
                                        <PlotVis data={expandedArtifact.visual.plotData} />
                                        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-24 h-24 sm:w-40 sm:h-40 z-20 bg-white/90 dark:bg-slate-800/90 rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden pointer-events-auto">
                                            <div className="absolute top-1 left-2 sm:top-2 sm:left-3 text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter z-10">3D View</div>
                                            <Geometry3DVis data={expandedArtifact.visual.geometry3DData} />
                                        </div>
                                    </>
                                ) : (
                                    <Geometry3DVis data={expandedArtifact.visual.geometry3DData} />
                                )}
                            </>
                        )}
                        {expandedArtifact.visual?.type === VisualType.GRAPH && expandedArtifact.visual.graphData && <GraphVis data={expandedArtifact.visual.graphData} />}
                        {expandedArtifact.visual?.type === VisualType.FLOWCHART && expandedArtifact.visual.flowchartData && <FlowchartVis data={expandedArtifact.visual.flowchartData} />}
                        {expandedArtifact.visual?.type === VisualType.MATRIX && expandedArtifact.visual.matrixData && <div className="h-full flex items-center justify-center scale-100 sm:scale-125 md:scale-150"><MatrixVis data={expandedArtifact.visual.matrixData} /></div>}
                        {expandedArtifact.visual?.type === VisualType.VECTOR_FIELD && expandedArtifact.visual.vectorFieldData && <VectorFieldVis data={expandedArtifact.visual.vectorFieldData} />}
                        {expandedArtifact.visual?.type === VisualType.UNIT_CIRCLE && expandedArtifact.visual.unitCircleData && <UnitCircleVis data={expandedArtifact.visual.unitCircleData} />}
                        {expandedArtifact.visual?.type === VisualType.COMPLEX_PLANE && expandedArtifact.visual.complexPlaneData && <ComplexPlaneVis data={expandedArtifact.visual.complexPlaneData} />}
                        {expandedArtifact.visual?.type === VisualType.VENN_DIAGRAM && expandedArtifact.visual.vennDiagramData && <VennDiagramVis data={expandedArtifact.visual.vennDiagramData} />}
                        {expandedArtifact.visual?.type === VisualType.BENTO && expandedArtifact.visual.bentoData && <BentoVis data={expandedArtifact.visual.bentoData} />}
                        {expandedArtifact.visual?.type === VisualType.TREE && expandedArtifact.visual.treeData && <TreeVis data={expandedArtifact.visual.treeData} />}
                        {expandedArtifact.visual?.type === VisualType.PARTICLE && expandedArtifact.visual.particleData && <ParticleVis data={expandedArtifact.visual.particleData} />}
                        {expandedArtifact.visual?.type === VisualType.QUIZ && expandedArtifact.visual.quizData && <QuizVis data={expandedArtifact.visual.quizData} />}
                        {expandedArtifact.visual?.type === VisualType.STEPS && expandedArtifact.visual.stepByStepData && <StepByStepVis data={expandedArtifact.visual.stepByStepData} />}
                    </div>

                    <div className="p-6 sm:p-8 shrink-0 relative group/text" style={{ background: 'var(--bg3)', borderTop: '1.5px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-4 sticky top-0 py-2 z-10" style={{ background: 'var(--bg3)' }}>
                            <div className="flex items-center gap-2" style={{ color: 'var(--blue)' }}>
                                <Edit2 size={16} />
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Professor's Explanation</span>
                            </div>
                            <button 
                                onClick={() => handleRead(expandedArtifact.text)}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all font-bold text-[10px] sm:text-xs ${isReading ? 'bg-brand-red text-white shadow-lg' : 'shadow-sm hover:shadow-md'}`} style={isReading ? {} : { background: 'var(--bg)', color: 'var(--blue)', border: '1px solid var(--border)' }}
                            >
                                {isReading ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                {isReading ? 'Stop Reading' : 'Read Aloud'}
                            </button>
                        </div>
                        <div className="text-sm sm:text-base font-medium leading-relaxed max-h-40 overflow-y-auto scrollbar-hide" style={{ color: 'var(--text2)' }}>
                            <FormattedText text={expandedArtifact.text} highlightIndex={readingSentenceIndex} />
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Whiteboard;
