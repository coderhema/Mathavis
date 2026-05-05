import React from 'react';
import { Delete, Check } from 'lucide-react';
import { soundService } from '../services/soundService';

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  isOpen: boolean;
}

const MathKeyboard: React.FC<MathKeyboardProps> = ({ onInsert, onDelete, onEnter, isOpen }) => {
  const handleInsert = (key: string) => {
    soundService.playBoop();
    onInsert(key);
  };

  const handleDelete = () => {
    soundService.playBoop();
    onDelete();
  };

  const handleEnter = () => {
    soundService.playBoop();
    onEnter();
  };
  const keys = [
    ['x', 'y', 'z', '(', ')'],
    ['7', '8', '9', '/', '^'],
    ['4', '5', '6', '*', '√'],
    ['1', '2', '3', '-', 'π'],
    ['0', '.', '=', '+', 'θ'],
    ['sin', 'cos', 'tan', '∫', '∑']
  ];

  if (!isOpen) return null;

  return (
    <div className="p-2 md:p-4 pb-8 animate-in slide-in-from-bottom duration-300 dark-transition"
         style={{ background: 'var(--bg3)', borderTop: '1.5px solid var(--border)' }}>
      <div className="max-w-4xl mx-auto grid grid-cols-[1fr_auto] gap-2">
        <div className="grid grid-cols-5 gap-1 md:gap-2">
          {keys.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => handleInsert(key)}
                  className="h-10 md:h-12 rounded-lg active:translate-y-1 active:shadow-none font-bold text-sm md:text-lg flex items-center justify-center transition-all"
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    boxShadow: '0 2px 0 var(--border2)',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)'}
                >
                  {key}
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-col gap-2 w-16 md:w-20">
            <button
                onClick={handleDelete}
                className="flex-1 rounded-lg active:translate-y-1 active:shadow-none flex items-center justify-center transition-all"
                style={{
                  background: 'var(--bg2)',
                  color: 'var(--text2)',
                  boxShadow: '0 2px 0 var(--border2)',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg2)'}
            >
                <Delete size={20} />
            </button>
            <button
                onClick={handleEnter}
                className="h-24 md:h-32 rounded-lg active:translate-y-1 active:shadow-none flex items-center justify-center transition-all text-white"
                style={{
                  background: 'var(--success)',
                  boxShadow: '0 2px 0 rgba(16, 185, 129, 0.5)',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'var(--success)'}
            >
                <Check size={28} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default MathKeyboard;