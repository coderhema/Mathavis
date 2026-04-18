import React, { useMemo } from 'react';
import { ParticleData } from '../../types';

interface ParticleVisProps {
  data: ParticleData;
}

const ParticleVis: React.FC<ParticleVisProps> = ({ data }) => {
  const particles = useMemo(() => {
    const nodes = data.particles.length > 0 ? data.particles : [{ id: 'p0', label: 'No particles provided' }];
    const total = nodes.length;
    const center = 200;

    return nodes.map((node, index) => {
      const angle = (index / Math.max(total, 1)) * Math.PI * 2;
      const radius = 70 + (index % 5) * 18;
      return {
        ...node,
        x: node.x ?? center + Math.cos(angle) * radius,
        y: node.y ?? center + Math.sin(angle) * radius,
        size: 10 + (node.weight ?? (index % 5)) * 2.5,
      };
    });
  }, [data]);

  const nodeById = new Map(particles.map(p => [p.id, p]));

  return (
    <div className="w-full h-full rounded-2xl bg-slate-950 overflow-hidden relative border border-slate-800">
      <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Particle
      </div>
      <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        {data.title}
      </div>
      {data.subtitle && <div className="absolute bottom-3 left-3 z-10 max-w-[70%] text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700">{data.subtitle}</div>}

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="particle-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1cb0f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#58cc02" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {data.links?.map((link, index) => {
          const a = nodeById.get(link.source);
          const b = nodeById.get(link.target);
          if (!a || !b) return null;
          return (
            <line
              key={index}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#94a3b8"
              strokeOpacity={0.18 + Math.min((link.strength ?? 1) / 4, 0.35)}
              strokeWidth="2"
            />
          );
        })}

        {particles.map((particle) => (
          <g key={particle.id} transform={`translate(${particle.x}, ${particle.y})`}>
            <circle r={particle.size + 16} fill="url(#particle-glow)" opacity="0.18" />
            <circle r={particle.size} fill="url(#particle-glow)" opacity="0.95" />
            <circle r={Math.max(4, particle.size * 0.42)} fill={particle.group === 2 ? '#58cc02' : particle.group === 3 ? '#a855f7' : '#1cb0f6'} opacity="0.95" />
            {particle.label && (
              <text
                y={particle.size + 14}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="10"
                fontWeight="700"
              >
                {particle.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

export default ParticleVis;
