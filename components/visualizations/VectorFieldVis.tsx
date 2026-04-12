import React, { useEffect, useRef } from 'react';
import * as math from 'mathjs';
import { VectorFieldData } from '../../types';

interface VectorFieldVisProps {
  data: VectorFieldData;
}

const VectorFieldVis: React.FC<VectorFieldVisProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const [xMin, xMax] = data.domain;
    const [yMin, yMax] = data.range;
    const density = data.density || 15;

    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // X-axis
    const zeroY = height / 2;
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    // Y-axis
    const zeroX = width / 2;
    ctx.moveTo(zeroX, padding);
    ctx.lineTo(zeroX, height - padding);
    ctx.stroke();

    try {
      const nodeX = math.parse(data.formulaX);
      const nodeY = math.parse(data.formulaY);
      const codeX = nodeX.compile();
      const codeY = nodeY.compile();

      const stepX = (xMax - xMin) / density;
      const stepY = (yMax - yMin) / density;

      for (let x = xMin; x <= xMax; x += stepX) {
        for (let y = yMin; y <= yMax; y += stepY) {
          const scope = { x, y, Math };
          const vx = codeX.evaluate(scope);
          const vy = codeY.evaluate(scope);

          // Map to canvas coordinates
          const cx = padding + ((x - xMin) / (xMax - xMin)) * innerWidth;
          const cy = height - (padding + ((y - yMin) / (yMax - yMin)) * innerHeight);

          // Draw arrow
          const length = Math.sqrt(vx * vx + vy * vy);
          const maxLength = Math.min(stepX, stepY) * 20; // Scale factor
          const normVx = (vx / (length || 1)) * 15;
          const normVy = (vy / (length || 1)) * 15;

          ctx.strokeStyle = `rgba(59, 130, 246, ${Math.min(length / 5, 1)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + normVx, cy - normVy);
          ctx.stroke();

          // Arrow head
          const angle = Math.atan2(normVy, normVx);
          ctx.beginPath();
          ctx.moveTo(cx + normVx, cy - normVy);
          ctx.lineTo(
            cx + normVx - 5 * Math.cos(angle - Math.PI / 6),
            cy - normVy + 5 * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(cx + normVx, cy - normVy);
          ctx.lineTo(
            cx + normVx - 5 * Math.cos(angle + Math.PI / 6),
            cy - normVy + 5 * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }
    } catch (e) {
      console.error("Vector field evaluation error:", e);
    }
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-4">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
        Vector Field: F(x,y) = ({data.formulaX}, {data.formulaY})
      </div>
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={500} 
        className="w-full h-full max-w-[500px] max-h-[500px] aspect-square"
      />
    </div>
  );
};

export default VectorFieldVis;
