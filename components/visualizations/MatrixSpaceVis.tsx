import React, { useMemo } from 'react';
import { MatrixData } from '../../types';

interface MatrixSpaceVisProps {
  data: MatrixData;
}

const MatrixSpaceVis: React.FC<MatrixSpaceVisProps> = ({ data }) => {
  const matrix = data.matrix;
  const isDark = document.documentElement.classList.contains('dark');
  
  const gridSize = 10;
  const spacing = 1;

  const transformedGrid = useMemo(() => {
    const lines = [];
    // Horizontal lines
    for (let y = -gridSize; y <= gridSize; y += spacing) {
      const points = [];
      for (let x = -gridSize; x <= gridSize; x += spacing / 2) {
        const tx = matrix[0][0] * x + matrix[0][1] * y;
        const ty = matrix[1][0] * x + matrix[1][1] * y;
        points.push({ x: tx, y: ty });
      }
      lines.push(points);
    }
    // Vertical lines
    for (let x = -gridSize; x <= gridSize; x += spacing) {
      const points = [];
      for (let y = -gridSize; y <= gridSize; y += spacing / 2) {
        const tx = matrix[0][0] * x + matrix[0][1] * y;
        const ty = matrix[1][0] * x + matrix[1][1] * y;
        points.push({ x: tx, y: ty });
      }
      lines.push(points);
    }
    return lines;
  }, [matrix]);

  const scale = 20;
  const center = 200;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
      <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest">{data.label || 'Space Transformation'}</h3>
      <svg viewBox="0 0 400 400" className="w-full h-full max-w-[350px] max-h-[350px]">
        {/* Original Grid (Subtle) */}
        <g opacity={0.1}>
          {Array.from({ length: 21 }, (_, i) => {
            const pos = (i - 10) * scale + center;
            return (
              <React.Fragment key={i}>
                <line x1={0} y1={pos} x2={400} y2={pos} stroke={isDark ? "white" : "black"} strokeWidth={1} />
                <line x1={pos} y1={0} x2={pos} y2={400} stroke={isDark ? "white" : "black"} strokeWidth={1} />
              </React.Fragment>
            );
          })}
        </g>

        {/* Transformed Grid */}
        <g>
          {transformedGrid.map((line, i) => (
            <polyline
              key={i}
              points={line.map(p => `${p.x * scale + center},${-p.y * scale + center}`).join(' ')}
              fill="none"
              stroke="#1CB0F6"
              strokeWidth={2}
              strokeOpacity={0.6}
            />
          ))}
        </g>

        {/* Basis Vectors */}
        <line 
          x1={center} y1={center} 
          x2={matrix[0][0] * scale + center} y2={-matrix[1][0] * scale + center} 
          stroke="#FF4B4B" strokeWidth={4} markerEnd="url(#arrow-red)" 
        />
        <line 
          x1={center} y1={center} 
          x2={matrix[0][1] * scale + center} y2={-matrix[1][1] * scale + center} 
          stroke="#4BFF4B" strokeWidth={4} markerEnd="url(#arrow-green)" 
        />

        {/* Axes */}
        <line x1={0} y1={center} x2={400} y2={center} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth={1} />
        <line x1={center} y1={0} x2={center} y2={400} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth={1} />

        <defs>
          <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#FF4B4B" />
          </marker>
          <marker id="arrow-green" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#4BFF4B" />
          </marker>
        </defs>
      </svg>
      <div className="mt-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#FF4B4B] rounded-full"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">î (Basis X)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#4BFF4B] rounded-full"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">ĵ (Basis Y)</span>
        </div>
      </div>
    </div>
  );
};

export default MatrixSpaceVis;
