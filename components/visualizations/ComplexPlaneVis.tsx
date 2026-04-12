import React from 'react';
import { ComplexPlaneData } from '../../types';

interface ComplexPlaneVisProps {
  data: ComplexPlaneData;
}

const ComplexPlaneVis: React.FC<ComplexPlaneVisProps> = ({ data }) => {
  const size = 300;
  const center = size / 2;
  const scale = 100 / 5; // 5 units = 100px

  const cx = center + data.real * scale;
  const cy = center - data.imaginary * scale;

  const magnitude = Math.sqrt(data.real * data.real + data.imaginary * data.imaginary);
  const angleRad = Math.atan2(data.imaginary, data.real);
  const angleDeg = (angleRad * 180) / Math.PI;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-4">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Complex Plane: z = {data.real} + {data.imaginary}i
      </div>
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Grid lines */}
        {[...Array(11)].map((_, i) => {
          const pos = center + (i - 5) * scale;
          return (
            <React.Fragment key={i}>
              <line x1={0} y1={pos} x2={size} y2={pos} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
              <line x1={pos} y1={0} x2={pos} y2={size} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
            </React.Fragment>
          );
        })}

        {/* Axes */}
        <line x1={0} y1={center} x2={size} y2={center} stroke="#cbd5e1" strokeWidth="2" />
        <line x1={center} y1={0} x2={center} y2={size} stroke="#cbd5e1" strokeWidth="2" />
        
        {/* Real/Imaginary Labels */}
        <text x={size - 10} y={center - 5} textAnchor="end" className="text-[10px] font-bold fill-slate-400">Re</text>
        <text x={center + 5} y={15} textAnchor="start" className="text-[10px] font-bold fill-slate-400">Im</text>

        {/* Vector */}
        <line x1={center} y1={center} x2={cx} y2={cy} stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
        
        {/* Point */}
        <circle cx={cx} cy={cy} r={6} fill="#3b82f6" className="drop-shadow-md" />

        {/* Polar Arc */}
        {data.showPolar && magnitude > 0 && (
          <path 
            d={`M ${center + 20} ${center} A 20 20 0 ${angleDeg < 0 ? 1 : 0} 0 ${center + 20 * Math.cos(angleRad)} ${center - 20 * Math.sin(angleRad)}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
          />
        )}
      </svg>

      <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-xs">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase">Magnitude |z|</span>
          <span className="text-lg font-black text-brand-blue">{magnitude.toFixed(3)}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase">Argument θ</span>
          <span className="text-lg font-black text-brand-yellow">{angleDeg.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
};

export default ComplexPlaneVis;
