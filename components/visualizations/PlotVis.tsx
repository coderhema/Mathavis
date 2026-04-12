
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush, Area, ComposedChart } from 'recharts';
import { PlotData } from '../../types';
import { RotateCcw, Layers, Circle } from 'lucide-react';

interface PlotVisProps {
  data: PlotData;
  isPreview?: boolean;
}

const PlotVis: React.FC<PlotVisProps> = ({ data, isPreview }) => {
  const [zoomKey, setZoomKey] = useState(0);
  const [showArea, setShowArea] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');
  const gridColor = isDark ? "#334155" : "#e2e8f0";
  const axisColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipBg = isDark ? "#1e293b" : "#ffffff";
  const tooltipText = isDark ? "#f1f5f9" : "#64748b";

  const handleResetZoom = () => {
    setZoomKey(prev => prev + 1);
  };

  if (isPreview) {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-900 p-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.points}>
            <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#1CB0F6" 
                strokeWidth={2} 
                dot={false} 
                animationDuration={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 group">
      <div className="w-full flex justify-between items-center mb-4 px-2">
         <div className="flex items-center gap-2">
           <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">{data.label}</h3>
           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button 
               onClick={() => setShowArea(!showArea)}
               className={`p-1.5 rounded-lg border transition-all shadow-sm ${showArea ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-brand-blue'}`}
               title="Toggle Area"
             >
               <Layers size={14} />
             </button>
             <button 
               onClick={() => setShowPoints(!showPoints)}
               className={`p-1.5 rounded-lg border transition-all shadow-sm ${showPoints ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-brand-blue'}`}
               title="Toggle Points"
             >
               <Circle size={14} />
             </button>
             <button 
               onClick={handleResetZoom}
               className="p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-blue transition-all shadow-sm"
               title="Reset Zoom"
             >
               <RotateCcw size={14} />
             </button>
           </div>
         </div>
         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Drag handle to zoom interval</span>
      </div>
      <div className="w-full h-[300px] md:h-[400px] bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-slate-100 dark:border-slate-800 p-2 md:p-4 transition-colors">
        <ResponsiveContainer key={zoomKey} width="100%" height="100%">
          <ComposedChart data={data.points} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis 
                dataKey="x" 
                type="number" 
                domain={data.domain} 
                allowDataOverflow={true}
                stroke={axisColor}
                fontSize={12}
                tick={{ fontWeight: 600 }}
            />
            <YAxis 
                stroke={axisColor}
                fontSize={12}
                tick={{ fontWeight: 600 }}
            />
            <Tooltip 
                cursor={{ stroke: '#1CB0F6', strokeWidth: 1, strokeDasharray: '5 5' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
                  backgroundColor: tooltipBg,
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                labelStyle={{ color: tooltipText, fontWeight: 800, marginBottom: '4px' }}
                itemStyle={{ color: '#1CB0F6', fontWeight: 700 }}
            />
            <ReferenceLine y={0} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth={2} />
            <ReferenceLine x={0} stroke={isDark ? "#475569" : "#94a3b8"} strokeWidth={2} />
            {showArea && (
              <Area 
                type="monotone" 
                dataKey="y" 
                fill="#1CB0F6" 
                stroke="none" 
                fillOpacity={0.2} 
                animationDuration={1500}
              />
            )}
            <Line 
                type="monotone" 
                dataKey="y" 
                stroke="#1CB0F6" 
                strokeWidth={4} 
                dot={showPoints ? { r: 4, fill: '#1CB0F6', strokeWidth: 0 } : false} 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#1CB0F6' }}
                animationDuration={1500}
            />
            {data.extraLines?.map(line => (
              <Line 
                key={line.key}
                type="monotone" 
                dataKey={line.key} 
                stroke={line.color} 
                strokeWidth={3} 
                strokeDasharray={line.dashed ? "5 5" : undefined}
                dot={false}
                animationDuration={1000}
              />
            ))}
            {data.extraPoints?.map((p, i) => (
              <ReferenceLine 
                key={i}
                x={p.x} 
                y={p.y} 
                stroke={p.color} 
                strokeWidth={2}
                label={{ position: 'top', value: p.label, fill: p.color, fontSize: 10, fontWeight: 800 }}
              />
            ))}
            {data.extraPoints?.map((p, i) => (
              <ReferenceLine 
                key={`dot-${i}`}
                x={p.x} 
                stroke={p.color} 
                strokeDasharray="3 3"
                opacity={0.3}
              />
            ))}
            <Brush 
                dataKey="x" 
                height={30} 
                stroke="#1CB0F6"
                fill={isDark ? "#1e293b" : "#f1f5f9"}
                travellerWidth={10}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PlotVis;
