import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { QuizData } from '../../types';
import { soundService } from '../../services/soundService';

interface QuizVisProps {
  data: QuizData;
  onComplete?: (isCorrect: boolean) => void;
}

export const QuizVis: React.FC<QuizVisProps> = ({ data, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOptionSelect = (optionId: string) => {
    if (isSubmitted) return;
    soundService.playClick();
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
    const selected = data.options.find(o => o.id === selectedOption);
    
    if (selected?.isCorrect) {
      soundService.playSuccess();
    } else {
      soundService.playError();
    }

    if (onComplete && selected) {
      onComplete(selected.isCorrect);
    }
  };

  const handleReset = () => {
    soundService.playPop();
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  const selectedOptionData = data.options.find(o => o.id === selectedOption);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl shadow-sm" style={{ background: 'var(--bg)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg" style={{ background: 'var(--bg3)' }}>
          <HelpCircle className="w-5 h-5" style={{ color: 'var(--blue)' }} />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Practice Question</h3>
      </div>

      <div className="mb-8">
        <p className="text-xl leading-relaxed font-medium" style={{ color: 'var(--text)' }}>
          {data.question}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {data.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCorrect = option.isCorrect;
          
          let bgColor = 'hover:border-indigo-300';
          let textColor = '';
          let icon = null;
          let bgStyle = { background: 'var(--bg2)', borderColor: 'var(--border)', borderWidth: 2, borderStyle: 'solid', color: 'var(--text)' };

          if (isSubmitted) {
            if (isCorrect) {
              bgColor = 'ring-1 ring-emerald-500';
              textColor = '';
              icon = <Check className="w-5 h-5" style={{ color: 'var(--success)' }} />;
              bgStyle = { background: 'var(--bg2)', borderColor: 'var(--success)', borderWidth: 2, borderStyle: 'solid', color: 'var(--success)' };
            } else if (isSelected && !isCorrect) {
              bgColor = 'ring-1 ring-rose-500';
              textColor = '';
              icon = <X className="w-5 h-5" style={{ color: 'var(--error)' }} />;
              bgStyle = { background: 'var(--bg2)', borderColor: 'var(--error)', borderWidth: 2, borderStyle: 'solid', color: 'var(--error)' };
            } else {
              bgColor = 'opacity-50';
              bgStyle = { background: 'var(--bg2)', borderColor: 'var(--border)', borderWidth: 2, borderStyle: 'solid', color: 'var(--text3)' };
            }
          } else if (isSelected) {
            bgColor = 'ring-1 ring-indigo-500';
            textColor = '';
            bgStyle = { background: 'var(--bg3)', borderColor: 'var(--blue)', borderWidth: 2, borderStyle: 'solid', color: 'var(--blue)' };
          }

          return (
            <motion.button
              key={option.id}
              whileHover={!isSubmitted ? { scale: 1.01 } : {}}
              whileTap={!isSubmitted ? { scale: 0.99 } : {}}
              onClick={() => handleOptionSelect(option.id)}
              disabled={isSubmitted}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left ${bgColor} ${textColor}`}
              style={bgStyle}
            >
              <span className="font-medium">{option.text}</span>
              {icon}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.button
            key="submit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={handleSubmit}
            disabled={!selectedOption}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedOption 
                ? 'text-white shadow-lg' 
                : 'cursor-not-allowed'
            }`}
            style={selectedOption ? { background: 'var(--blue)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } : { background: 'var(--bg3)', color: 'var(--text3)' }}
          >
            Submit Answer
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        ) : (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-6"
          >
            <div className="p-4 rounded-xl" style={selectedOptionData?.isCorrect ? { background: 'var(--bg2)', color: 'var(--success)' } : { background: 'var(--bg2)', color: 'var(--error)' }}>
              <p className="font-semibold mb-2">
                {selectedOptionData?.isCorrect ? 'Correct!' : 'Not quite right.'}
              </p>
              <p className="text-sm leading-relaxed">
                {data.explanation}
              </p>
            </div>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-2 font-medium transition-colors mx-auto"
              style={{ color: 'var(--blue)' }}
            >
              <RotateCcw className="w-4 h-4" />
              Try Another Question
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
