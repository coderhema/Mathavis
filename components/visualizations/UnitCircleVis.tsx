import React from 'react';
import { motion } from 'motion/react';
import { UnitCircleData } from '../../types';

interface UnitCircleVisProps {
  data: UnitCircleData;
}

const UnitCircleVis: React.FC<UnitCircleVisProps> = ({ data }) => {
  const angleRad = (data.angle * Math.PI) / 180;
  const x = Math.cos(angleRad);
  const y = Math.sin(angleRad);
  
  const size = 300;
  const center = size / 2;
  const radius = 100;

  const cx = center + x * radius;
  const cy = center - y * radius;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-4">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Unit Circle: θ = {data.angle}°
      </div>
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Axes */}
        <line x1={0} y1={center} x2={size} y2={center} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="#cbd5e1" strokeWidth="1" />
        
        {/* Circle */}
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Angle Arc */}
        <path 
          d={`M ${center + 20} ${center} A 20 20 0 ${data.angle > 180 ? 1 : 0} 0 ${center + 20 * Math.cos(angleRad)} ${center - 20 * Math.sin(angleRad)}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* Cosine Line (X) */}
        {data.showCosine && (
          <line x1={center} y1={center} x2={cx} y2={center} stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        )}
        
        {/* Sine Line (Y) */}
        {data.showSine && (
          <line x1={cx} y1={center} x2={cx} y2={cy} stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Hypotenuse */}
        <line x1={center} y1={center} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="2" />
        
        {/* Point */}
        <circle cx={cx} cy={cy} r={5} fill="#3b82f6" />

        {/* Labels */}
        <g className="text-[10px] font-bold">
          <text x={cx} y={cy - 10} textAnchor="middle" fill="#3b82f6">P(cos θ, sin θ)</text>
          {data.showCosine && <text x={center + (x * radius) / 2} y={center + 15} textAnchor="middle" fill="#ef4444">cos θ = {x.toFixed(2)}</text>}
          {data.showSine && <text x={cx + 10} y={center - (y * radius) / 2} textAnchor="start" fill="#22c55e">sin θ = {y.toFixed(2)}</text>}
        </g>
      </svg>

      <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-xs">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase">Cosine</span>
          <span className="text-lg font-black text-brand-red">{x.toFixed(3)}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase">Sine</span>
          <span className="text-lg font-black text-brand-green">{y.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
};

export default UnitCircleVis;
