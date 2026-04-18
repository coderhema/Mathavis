import React from 'react';
import { BentoData } from '../../types';
import { Sparkles } from 'lucide-react';

interface BentoVisProps {
  data: BentoData;
}

const BentoVis: React.FC<BentoVisProps> = ({ data }) => {
  const items = data.items.length > 0 ? data.items : [{ title: 'No items', description: 'The model did not provide bento items.' }];

  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 p-4 md:p-6 overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 text-brand-blue font-black uppercase tracking-[0.18em] text-[10px] mb-1">
            <Sparkles size={14} /> Bento
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">{data.title}</h3>
          {data.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">{data.subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="relative rounded-2xl p-4 md:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_6px_0_rgba(15,23,42,0.04)] overflow-hidden"
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: item.accent || 'linear-gradient(90deg, #1cb0f6, #58cc02)' }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-100">{item.title}</h4>
                {item.description && <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-300">{item.description}</p>}
              </div>
              {item.metric && (
                <div className="shrink-0 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-black text-xs">
                  {item.metric}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BentoVis;
