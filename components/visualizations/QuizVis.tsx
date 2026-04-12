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
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Practice Question</h3>
      </div>

      <div className="mb-8">
        <p className="text-xl text-slate-700 leading-relaxed font-medium">
          {data.question}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {data.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const isCorrect = option.isCorrect;
          
          let bgColor = 'bg-slate-50 border-slate-200 hover:border-indigo-300';
          let textColor = 'text-slate-700';
          let icon = null;

          if (isSubmitted) {
            if (isCorrect) {
              bgColor = 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500';
              textColor = 'text-emerald-700';
              icon = <Check className="w-5 h-5 text-emerald-600" />;
            } else if (isSelected && !isCorrect) {
              bgColor = 'bg-rose-50 border-rose-500 ring-1 ring-rose-500';
              textColor = 'text-rose-700';
              icon = <X className="w-5 h-5 text-rose-600" />;
            } else {
              bgColor = 'bg-slate-50 border-slate-200 opacity-50';
            }
          } else if (isSelected) {
            bgColor = 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500';
            textColor = 'text-indigo-700';
          }

          return (
            <motion.button
              key={option.id}
              whileHover={!isSubmitted ? { scale: 1.01 } : {}}
              whileTap={!isSubmitted ? { scale: 0.99 } : {}}
              onClick={() => handleOptionSelect(option.id)}
              disabled={isSubmitted}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left ${bgColor} ${textColor}`}
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
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
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
            <div className={`p-4 rounded-xl ${selectedOptionData?.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              <p className="font-semibold mb-2">
                {selectedOptionData?.isCorrect ? 'Correct!' : 'Not quite right.'}
              </p>
              <p className="text-sm leading-relaxed">
                {data.explanation}
              </p>
            </div>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors mx-auto"
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
