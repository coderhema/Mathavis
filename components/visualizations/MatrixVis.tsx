
import React, { useState } from 'react';
import { MatrixData } from '../../types';
import { Copy, RefreshCw, Check, Grid } from 'lucide-react';

interface MatrixVisProps {
  data: MatrixData;
}

const MatrixVis: React.FC<MatrixVisProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [isTransposed, setIsTransposed] = useState(false);
  const [isHeatmap, setIsHeatmap] = useState(false);
  const [copied, setCopied] = useState(false);

  const matrix = isTransposed 
    ? data.matrix[0].map((_, colIndex) => data.matrix.map(row => row[colIndex]))
    : data.matrix;

  const numCols = matrix[0]?.length || 0;
  
  // Find max value for heatmap scaling
  const allValues = matrix.flat();
  const maxVal = Math.max(...allValues.map(Math.abs));

  const handleCopy = () => {
    const text = matrix.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHeatmapColor = (val: number) => {
    if (!isHeatmap) return '';
    const ratio = maxVal === 0 ? 0 : Math.abs(val) / maxVal;
    const opacity = 0.1 + ratio * 0.8;
    return val >= 0 ? `rgba(28, 176, 246, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-10 rounded-3xl shadow-xl transition-colors relative group" style={{ background: 'var(--bg)', borderWidth: 2, borderColor: 'var(--border)', borderStyle: 'solid' }}>
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => setIsHeatmap(!isHeatmap)}
          className={`p-2 rounded-xl border transition-all ${isHeatmap ? 'text-white' : 'hover:text-brand-green'}`}
          style={isHeatmap ? { background: 'var(--success)', borderColor: 'var(--success)', borderWidth: 1, borderStyle: 'solid' } : { background: 'var(--bg)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid', color: 'var(--text3)' }}
          title="Toggle Heatmap"
        >
          <Grid size={16} />
        </button>
        <button 
          onClick={() => setIsTransposed(!isTransposed)}
          className={`p-2 rounded-xl border transition-all ${isTransposed ? 'text-white' : 'hover:text-brand-blue'}`}
          style={isTransposed ? { background: 'var(--blue)', borderColor: 'var(--blue)', borderWidth: 1, borderStyle: 'solid' } : { background: 'var(--bg)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid', color: 'var(--text3)' }}
          title="Transpose Matrix"
        >
          <RefreshCw size={16} className={isTransposed ? 'rotate-90' : ''} />
        </button>
        <button 
          onClick={handleCopy}
          className="p-2 rounded-xl border transition-all hover:text-brand-green"
          style={{ background: 'var(--bg)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid', color: 'var(--text3)' }}
          title="Copy to Clipboard"
        >
          {copied ? <Check size={16} className="text-brand-green" /> : <Copy size={16} />}
        </button>
      </div>

      <h3 className="text-sm font-bold mb-6 uppercase tracking-[0.2em]" style={{ color: 'var(--text3)' }}>
        {data.label || 'Matrix View'} {isTransposed && '(Transposed)'}
      </h3>
      
      <div className="flex items-center group/matrix max-w-full overflow-x-auto pb-4 scrollbar-hide w-full justify-center">
        {/* Left Bracket */}
        <div className="w-3 md:w-5 border-l-[4px] md:border-l-[6px] border-t-[4px] md:border-t-[6px] border-b-[4px] md:border-b-[6px] rounded-l-xl md:rounded-l-2xl self-stretch mr-2 md:mr-4 sticky left-0 z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]" style={{ borderColor: 'var(--text)', background: 'var(--bg)' }}></div>
        
        <div 
          className="grid gap-1 md:gap-3 p-1 md:p-2" 
          style={{ 
            gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
            minWidth: "fit-content"
          }}
          onMouseLeave={() => setHoveredCell(null)}
        >
          {matrix.map((row, i) => (
            row.map((val, j) => {
              const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
              const isRowHovered = hoveredCell?.row === i;
              const isColHovered = hoveredCell?.col === j;
              const heatmapColor = getHeatmapColor(val);

              return (
                <div 
                  key={`${i}-${j}`} 
                  onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                  style={isHeatmap ? { backgroundColor: heatmapColor, color: Math.abs(val) / maxVal > 0.5 ? 'white' : undefined } : (isRowHovered || isColHovered) ? { background: 'var(--bg3)', color: 'var(--blue)' } : { background: 'var(--bg2)', color: 'var(--text2)' }}
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 flex items-center justify-center text-sm sm:text-base md:text-xl font-mono font-black rounded-lg md:rounded-xl transition-all duration-200 cursor-default
                    ${isHovered 
                      ? 'bg-brand-blue text-white scale-110 shadow-xl z-30 ring-2 md:ring-4 ring-brand-blue/30' 
                      : (isRowHovered || isColHovered)
                        ? isHeatmap 
                          ? 'ring-1 md:ring-2 ring-brand-blue/60 z-10 shadow-inner' 
                          : 'z-10'
                        : isHeatmap ? 'opacity-90 hover:opacity-100' : ''
                    }
                  `}
                >
                  {val}
                </div>
              );
            })
          ))}
        </div>

        {/* Right Bracket */}
        <div className="w-3 md:w-5 border-r-[4px] md:border-r-[6px] border-t-[4px] md:border-t-[6px] border-b-[4px] md:border-b-[6px] rounded-r-xl md:rounded-r-2xl self-stretch ml-2 md:ml-4 sticky right-0 z-20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]" style={{ borderColor: 'var(--text)', background: 'var(--bg)' }}></div>
      </div>
      <div className="mt-8 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
        {hoveredCell ? `Row ${hoveredCell.row + 1}, Col ${hoveredCell.col + 1}` : 'Hover cells to highlight lines'}
      </div>
    </div>
  );
};

export default MatrixVis;
