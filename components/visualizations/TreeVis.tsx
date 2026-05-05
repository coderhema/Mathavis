import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TreeData, TreeNode } from '../../types';

interface TreeVisProps {
  data: TreeData;
}

interface NodePosition extends TreeNode {
  x: number;
  y: number;
  depth: number;
}

const TreeVis: React.FC<TreeVisProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const el = containerRef.current;
      if (el) setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    const nodes = data.nodes || [];
    if (!size.width || !size.height || nodes.length === 0) return { nodes: [] as NodePosition[], links: [] as { from: NodePosition; to: NodePosition }[] };

    const byId = new Map(nodes.map(node => [node.id, node]));
    const getDepth = (node: TreeNode, cache = new Map<string, number>()): number => {
      if (cache.has(node.id)) return cache.get(node.id)!;
      const parent = node.parentId ? byId.get(node.parentId) : undefined;
      const depth = parent ? getDepth(parent, cache) + 1 : 0;
      cache.set(node.id, depth);
      return depth;
    };

    const levels = new Map<number, TreeNode[]>();
    const depthCache = new Map<string, number>();
    nodes.forEach(node => {
      const depth = getDepth(node, depthCache);
      const arr = levels.get(depth) || [];
      arr.push(node);
      levels.set(depth, arr);
    });

    const maxDepth = Math.max(...Array.from(levels.keys()), 0);
    const levelGap = Math.max(110, Math.min(150, (size.height - 120) / Math.max(maxDepth + 1, 1)));
    const positions = new Map<string, NodePosition>();

    Array.from(levels.entries()).forEach(([depth, levelNodes]) => {
      const count = levelNodes.length;
      const availableWidth = size.width - 64;
      levelNodes.forEach((node, index) => {
        const x = count === 1 ? size.width / 2 : 32 + (availableWidth / (count + 1)) * (index + 1);
        const y = 70 + depth * levelGap;
        positions.set(node.id, { ...node, x, y, depth });
      });
    });

    const links = nodes
      .filter(node => node.parentId && positions.has(node.parentId) && positions.has(node.id))
      .map(node => ({ from: positions.get(node.parentId!)!, to: positions.get(node.id)! }));

    return { nodes: Array.from(positions.values()), links };
  }, [data, size]);

  const rootNode = data.nodes.find(node => node.id === data.rootId) || data.nodes.find(node => !node.parentId) || data.nodes[0];

  return (
    <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden relative" style={{ background: 'var(--bg)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid' }}>
      <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm" style={{ background: 'rgba(255,255,255,0.9)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid', color: 'var(--text3)' }}>
        Tree
      </div>
      <div className="absolute top-3 right-3 z-10 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.8)', color: 'var(--text3)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid' }}>
        {data.title}
      </div>
      {data.subtitle && (
        <div className="absolute top-12 left-3 z-10 max-w-[75%] text-[11px] px-2 py-1 rounded-lg" style={{ color: 'var(--text3)', background: 'rgba(255,255,255,0.8)', borderColor: 'var(--border)', borderWidth: 1, borderStyle: 'solid' }}>
          {data.subtitle}
        </div>
      )}

      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="tree-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1cb0f6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#58cc02" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {layout.links.map((link, index) => (
          <line
            key={index}
            x1={link.from.x}
            y1={link.from.y + 26}
            x2={link.to.x}
            y2={link.to.y - 26}
            stroke="url(#tree-line)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {layout.nodes.map(node => {
        const isRoot = rootNode?.id === node.id;
        const bgStyle = node.group === 2 ? { background: 'var(--success)' } : node.group === 3 ? { background: 'var(--purple)' } : isRoot ? { background: 'var(--blue)' } : { background: 'var(--bg3)' };
        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: node.x, top: node.y }}
          >
            <div className="min-w-[130px] max-w-[180px] rounded-2xl px-4 py-3 text-white shadow-xl" style={bgStyle}>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{node.parentId ? 'Node' : 'Root'}</div>
              <div className="font-black text-sm leading-snug">{node.label}</div>
              {node.note && <div className="mt-1 text-[11px] text-white/80 leading-snug">{node.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TreeVis;
