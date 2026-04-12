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
    <div className="bg-slate-200 dark:bg-slate-950 p-2 md:p-4 pb-8 border-t-2 border-slate-300 dark:border-slate-800 animate-in slide-in-from-bottom duration-300 transition-colors">
      <div className="max-w-4xl mx-auto grid grid-cols-[1fr_auto] gap-2">
        <div className="grid grid-cols-5 gap-1 md:gap-2">
          {keys.map((row, i) => (
            <React.Fragment key={i}>
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => handleInsert(key)}
                  className="h-10 md:h-12 rounded-lg bg-white dark:bg-slate-800 shadow-[0_2px_0_#cbd5e1] dark:shadow-[0_2px_0_#1e293b] active:translate-y-1 active:shadow-none hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-slate-600 dark:text-slate-200 text-sm md:text-lg flex items-center justify-center transition-all"
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
                className="flex-1 rounded-lg bg-slate-300 dark:bg-slate-800 shadow-[0_2px_0_#94a3b8] dark:shadow-[0_2px_0_#1e293b] active:translate-y-1 active:shadow-none hover:bg-slate-400 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all"
            >
                <Delete size={20} />
            </button>
            <button 
                onClick={handleEnter}
                className="h-24 md:h-32 rounded-lg bg-brand-green shadow-[0_2px_0_#46A302] active:translate-y-1 active:shadow-none hover:bg-brand-greenDark text-white flex items-center justify-center transition-all"
            >
                <Check size={28} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default MathKeyboard;