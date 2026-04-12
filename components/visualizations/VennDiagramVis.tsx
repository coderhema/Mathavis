import React from 'react';
import { VennDiagramData } from '../../types';

interface VennDiagramVisProps {
  data: VennDiagramData;
}

const VennDiagramVis: React.FC<VennDiagramVisProps> = ({ data }) => {
  const size = 300;
  const center = size / 2;
  
  // Simple 2 or 3 set Venn diagram
  const colors = ['rgba(59, 130, 246, 0.4)', 'rgba(239, 68, 68, 0.4)', 'rgba(34, 197, 94, 0.4)'];
  const borderColors = ['#3b82f6', '#ef4444', '#22c55e'];

  const getCircleProps = (index: number, total: number) => {
    const radius = 70;
    if (total === 1) return { cx: center, cy: center, r: radius };
    if (total === 2) {
      const offset = 40;
      return { cx: index === 0 ? center - offset : center + offset, cy: center, r: radius };
    }
    if (total === 3) {
      const offset = 45;
      const angle = (index * 2 * Math.PI) / 3 - Math.PI / 2;
      return {
        cx: center + offset * Math.cos(angle),
        cy: center + offset * Math.sin(angle),
        r: radius
      };
    }
    return { cx: center, cy: center, r: radius };
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-4">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Venn Diagram: {data.sets.map(s => s.label).join(' ∩ ')}
      </div>
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {data.sets.map((set, i) => {
          const props = getCircleProps(i, data.sets.length);
          return (
            <g key={i}>
              <circle 
                cx={props.cx} 
                cy={props.cy} 
                r={props.r} 
                fill={colors[i % colors.length]} 
                stroke={borderColors[i % borderColors.length]} 
                strokeWidth="2" 
              />
              <text 
                x={props.cx} 
                y={props.cy - props.r - 10} 
                textAnchor="middle" 
                className="text-xs font-bold fill-slate-500 dark:fill-slate-400"
              >
                {set.label}
              </text>
            </g>
          );
        })}
        
        {/* Intersection Labels (Simplified) */}
        {data.intersections.map((inter, i) => {
          if (inter.sets.length === 2 && data.sets.length === 2) {
            return (
              <text 
                key={i} 
                x={center} 
                y={center} 
                textAnchor="middle" 
                className="text-[10px] font-black fill-slate-700 dark:fill-slate-200"
              >
                {inter.size}
              </text>
            );
          }
          return null;
        })}
      </svg>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {data.sets.map((set, i) => (
          <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: borderColors[i % borderColors.length] }} />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{set.label}: {set.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VennDiagramVis;
