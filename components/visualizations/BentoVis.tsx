import React from 'react';
import { BentoData } from '../../types';
import { Sparkles } from 'lucide-react';

interface BentoVisProps {
  data: BentoData;
}

const BentoVis: React.FC<BentoVisProps> = ({ data }) => {
  const items = data.items.length > 0 ? data.items : [{ title: 'No items', description: 'The model did not provide bento items.' }];

  return (
    <div className="w-full h-full rounded-2xl border p-4 md:p-6 overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--bg), var(--bg2))', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid' }}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 font-black uppercase tracking-[0.18em] text-[10px] mb-1" style={{ color: 'var(--blue)' }}>
            <Sparkles size={14} /> Bento
          </div>
          <h3 className="text-xl md:text-2xl font-black" style={{ color: 'var(--text)' }}>{data.title}</h3>
          {data.subtitle && <p className="text-sm mt-1 max-w-xl" style={{ color: 'var(--text3)' }}>{data.subtitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="relative rounded-2xl p-4 md:p-5 shadow-[0_6px_0_rgba(15,23,42,0.04)] overflow-hidden"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid' }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: item.accent || 'linear-gradient(90deg, #1cb0f6, #58cc02)' }}
            />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base md:text-lg font-black" style={{ color: 'var(--text)' }}>{item.title}</h4>
                {item.description && <p className="mt-2 text-sm md:text-base leading-relaxed" style={{ color: 'var(--text2)' }}>{item.description}</p>}
              </div>
              {item.metric && (
                <div className="shrink-0 px-2.5 py-1 rounded-xl font-black text-xs" style={{ background: 'var(--bg3)', color: 'var(--text2)' }}>
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
