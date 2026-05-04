import React, { useState, useEffect, useMemo } from 'react';
import { Search, Play, Book, Info, ArrowRight, Maximize2, X, Settings2, RefreshCcw } from 'lucide-react';
import { VisualContent, VisualType } from '../types';
import PlotVis from './visualizations/PlotVis';
import Plot3DVis from './visualizations/Plot3DVis';
import GraphVis from './visualizations/GraphVis';
import MatrixVis from './visualizations/MatrixVis';
import MatrixSpaceVis from './visualizations/MatrixSpaceVis';
import Geometry3DVis from './visualizations/Geometry3DVis';
import { soundService } from '../services/soundService';
import * as math from 'mathjs';

interface Control {
  id: string;
  label: string;
  type: 'slider' | 'select' | 'input';
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: any;
}

interface LibraryTopic {
  id: string;
  title: string;
  description: string;
  category: 'Calculus' | 'Linear Algebra' | 'Discrete Math' | 'Geometry';
  visual: VisualContent;
  explanation: string;
  controls?: Control[];
}

const LIBRARY_TOPICS: LibraryTopic[] = [
  {
    id: 'limits',
    title: 'Concept of Limits',
    description: 'Visualize how a function approaches a value as x gets closer to a point.',
    category: 'Calculus',
    explanation: 'A limit is the value that a function "approaches" as the input "approaches" some value. In this visualization, you can move the target point "a" to see how the function behaves near it. The delta (δ) represents the neighborhood around "a".',
    controls: [
      { id: 'a', label: 'Approach Point (a)', type: 'slider', min: -5, max: 5, step: 0.1, defaultValue: 0 },
      { id: 'delta', label: 'Delta (δ)', type: 'slider', min: 0.1, max: 2, step: 0.1, defaultValue: 0.5 }
    ],
    visual: {
      type: VisualType.PLOT,
      plotData: {
        label: 'f(x) = sin(x)/x',
        domain: [-10, 10],
        points: [] // Generated dynamically
      }
    }
  },
  {
    id: 'integrals',
    title: 'Riemann Sums (Integrals)',
    description: 'Approximating the area under a curve using rectangles.',
    category: 'Calculus',
    explanation: 'The definite integral of a function can be thought of as the signed area of the region in the xy-plane bounded by the graph of f, the x-axis, and the vertical lines x = a and x = b. Increasing the number of rectangles improves the approximation.',
    controls: [
      { id: 'n', label: 'Number of Rectangles (n)', type: 'slider', min: 4, max: 100, step: 1, defaultValue: 10 },
      { id: 'method', label: 'Sum Method', type: 'select', options: ['Left', 'Right', 'Midpoint'], defaultValue: 'Midpoint' }
    ],
    visual: {
      type: VisualType.PLOT,
      plotData: {
        label: 'f(x) = x²',
        domain: [0, 5],
        points: [] // Generated dynamically
      }
    }
  },
  {
    id: 'derivatives',
    title: 'The Derivative',
    description: 'Visualizing the instantaneous rate of change as a tangent line.',
    category: 'Calculus',
    explanation: 'The derivative measures the sensitivity to change of the function value. Geometrically, it is the slope of the tangent line. Move the point "x₀" to see the tangent line change.',
    controls: [
      { id: 'x0', label: 'Point (x₀)', type: 'slider', min: -3, max: 3, step: 0.1, defaultValue: 0 }
    ],
    visual: {
      type: VisualType.PLOT,
      plotData: {
        label: 'f(x) = sin(x)',
        domain: [-6.28, 6.28],
        points: [] // Generated dynamically
      }
    }
  },
  {
    id: 'matrix-transform',
    title: 'Matrix Transformations',
    description: 'How matrices transform vectors and the entire coordinate space.',
    category: 'Linear Algebra',
    explanation: 'A matrix can scale, rotate, or shear the entire space. Adjust the matrix values to see the effect on the grid. The red and green vectors represent the basis vectors î and ĵ after transformation.',
    controls: [
      { id: 'a11', label: 'a₁₁ (Scale X)', type: 'slider', min: -2, max: 2, step: 0.1, defaultValue: 1 },
      { id: 'a12', label: 'a₁₂ (Shear X)', type: 'slider', min: -2, max: 2, step: 0.1, defaultValue: 0 },
      { id: 'a21', label: 'a₂₁ (Shear Y)', type: 'slider', min: -2, max: 2, step: 0.1, defaultValue: 0 },
      { id: 'a22', label: 'a₂₂ (Scale Y)', type: 'slider', min: -2, max: 2, step: 0.1, defaultValue: 1 }
    ],
    visual: {
      type: VisualType.MATRIX,
      matrixData: {
        matrix: [[1, 0], [0, 1]],
        label: 'Transformation Matrix'
      }
    }
  },
  {
    id: 'pythagorean',
    title: 'Pythagorean Theorem',
    description: 'Visual proof of a² + b² = c² in right-angled triangles.',
    category: 'Geometry',
    explanation: 'The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides. Adjust sides a and b to see the relationship.',
    controls: [
      { id: 'a', label: 'Side a', type: 'slider', min: 1, max: 10, step: 1, defaultValue: 3 },
      { id: 'b', label: 'Side b', type: 'slider', min: 1, max: 10, step: 1, defaultValue: 4 }
    ],
    visual: {
      type: VisualType.GEOMETRY3D,
      geometry3DData: {
        shape: 'box',
        params: { width: 3, height: 4, depth: 0.1 },
        label: 'Right Triangle'
      }
    }
  },
  {
    id: 'saddle-point',
    title: 'Saddle Points in 3D',
    description: 'Exploring critical points that are neither local maxima nor local minima.',
    category: 'Calculus',
    explanation: 'A saddle point is a point on a surface where the slopes in orthogonal directions are zero, but it is not an extremum. Adjust the curvature to see how the saddle changes.',
    controls: [
      { id: 'k', label: 'Curvature Factor', type: 'slider', min: 0.5, max: 3, step: 0.1, defaultValue: 1 }
    ],
    visual: {
      type: VisualType.PLOT3D,
      plot3DData: {
        formula: 'x^2 - y^2',
        xRange: [-2, 2],
        yRange: [-2, 2],
        label: 'z = x² - y²'
      }
    }
  }
];

const Library: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<LibraryTopic | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
  const [params, setParams] = useState<Record<string, any>>({});

  const categories = ['All', 'Calculus', 'Linear Algebra', 'Discrete Math', 'Geometry'];

  const filteredTopics = LIBRARY_TOPICS.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || topic.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTopicClick = (topic: LibraryTopic) => {
    soundService.playBoop();
    const initialParams: Record<string, any> = {};
    topic.controls?.forEach(c => {
      initialParams[c.id] = c.defaultValue;
    });
    setParams(initialParams);
    setSelectedTopic(topic);
  };

  const handleParamChange = (id: string, value: any) => {
    setParams(prev => ({ ...prev, [id]: value }));
  };

  const liveVisual = useMemo(() => {
    if (!selectedTopic) return null;
    const visual = { ...selectedTopic.visual };

    if (selectedTopic.id === 'limits') {
      const a = params.a ?? 0;
      const delta = params.delta ?? 0.5;
      const f = (x: number) => x === 0 ? 1 : Math.sin(x) / x;
      visual.plotData = {
        ...visual.plotData!,
        points: Array.from({ length: 200 }, (_, i) => {
          const x = -10 + (i / 199) * 20;
          return { x, y: f(x) };
        }),
        extraPoints: [
          { x: a, y: f(a), label: `(a, f(a))`, color: '#FF4B4B' },
          { x: a - delta, y: 0, label: 'a-δ', color: '#1CB0F6' },
          { x: a + delta, y: 0, label: 'a+δ', color: '#1CB0F6' }
        ]
      };
    } else if (selectedTopic.id === 'integrals') {
      const n = params.n ?? 10;
      const method = params.method ?? 'Midpoint';
      const f = (x: number) => x * x;
      const start = 0;
      const end = 5;
      const dx = (end - start) / n;
      
      const points = Array.from({ length: 100 }, (_, i) => {
        const x = start + (i / 99) * (end - start);
        return { x, y: f(x) };
      });

      // Add rectangles as extra lines
      const extraLines: any[] = [];
      for (let i = 0; i < n; i++) {
        const x1 = start + i * dx;
        const x2 = x1 + dx;
        let h = 0;
        if (method === 'Left') h = f(x1);
        else if (method === 'Right') h = f(x2);
        else h = f(x1 + dx / 2);

        // We can't easily draw rectangles with LineChart, but we can approximate with vertical lines
        // For now, let's just show the points used for the sum
        points.push({ x: x1, y: 0, [`rect_${i}`]: h });
        points.push({ x: x2, y: 0, [`rect_${i}`]: h });
        extraLines.push({ key: `rect_${i}`, color: '#1CB0F6', label: '', dashed: false });
      }

      visual.plotData = {
        ...visual.plotData!,
        points: points.sort((a, b) => a.x - b.x),
        extraLines
      };
    } else if (selectedTopic.id === 'derivatives') {
      const x0 = params.x0 ?? 0;
      const f = (x: number) => Math.sin(x);
      const df = (x: number) => Math.cos(x);
      const slope = df(x0);
      const y0 = f(x0);
      
      visual.plotData = {
        ...visual.plotData!,
        points: Array.from({ length: 100 }, (_, i) => {
          const x = -6.28 + (i / 99) * 12.56;
          const tangentY = y0 + slope * (x - x0);
          return { x, y: f(x), tangent: tangentY };
        }),
        extraLines: [
          { key: 'tangent', color: '#FF4B4B', label: 'Tangent Line', dashed: true }
        ],
        extraPoints: [
          { x: x0, y: y0, label: `(x₀, f(x₀))`, color: '#FF4B4B' }
        ]
      };
    } else if (selectedTopic.id === 'matrix-transform') {
      visual.matrixData = {
        ...visual.matrixData!,
        matrix: [
          [params.a11 ?? 1, params.a12 ?? 0],
          [params.a21 ?? 0, params.a22 ?? 1]
        ]
      };
    } else if (selectedTopic.id === 'saddle-point') {
      const k = params.k ?? 1;
      visual.plot3DData = {
        ...visual.plot3DData!,
        formula: `${k} * (x^2 - y^2)`
      };
    } else if (selectedTopic.id === 'pythagorean') {
      const a = params.a ?? 3;
      const b = params.b ?? 4;
      visual.geometry3DData = {
        ...visual.geometry3DData!,
        params: { width: a, height: b, depth: 0.5 }
      };
    }

    return visual;
  }, [selectedTopic, params]);

  return (
    <div
      className="flex-1 min-h-0 flex flex-col overflow-hidden dark-transition"
      style={{ background: 'var(--bg2)' }}
    >
      {/* Header */}
      <div className="z-10 shrink-0" style={{ background: 'var(--bg)', borderBottom: '1.5px solid var(--border)', padding: '1.5rem 2rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="mono-label mb-1 block">Visual Library</span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                Interactive Concepts
              </h1>
              <p className="mono-hint mt-1">Curated explanations for core math topics</p>
            </div>

            {/* Search */}
            <div className="relative group" style={{ minWidth: 0 }}>
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[var(--blue)]"
                size={18}
                style={{ color: 'var(--text3)' }}
              />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ds-input pl-11 w-full md:w-80"
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { soundService.playBoop(); setActiveCategory(cat); }}
                className={'chip' + (activeCategory === cat ? ' selected' : '')}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-hide">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTopics.map(topic => (
            <div
              key={topic.id}
              onClick={() => handleTopicClick(topic)}
              className="ds-card group rounded-[24px] p-6 cursor-pointer flex flex-col transition-all hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-4 duration-500"
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--blue)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="px-3 py-1 rounded-lg mono-label"
                  style={{ background: 'var(--bg3)', color: 'var(--text3)' }}
                >
                  {topic.category}
                </span>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--blue)' }}
                >
                  <Play size={18} fill="currentColor" />
                </div>
              </div>

              <h3
                className="text-lg font-black mb-2 transition-colors group-hover:text-[var(--blue)]"
                style={{ color: 'var(--text)' }}
              >
                {topic.title}
              </h3>
              <p className="mono-hint leading-relaxed flex-1">{topic.description}</p>

              <div className="mt-5 pt-5 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mono-label" style={{ color: 'var(--blue)' }}>
                  <Info size={12} />
                  Explore
                </div>
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                  style={{ color: 'var(--text3)' }}
                />
              </div>
            </div>
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'var(--bg3)', color: 'var(--text3)' }}
            >
              <Search size={36} />
            </div>
            <h3 className="text-lg font-black" style={{ color: 'var(--text2)' }}>No topics found</h3>
            <p className="mono-hint mt-1">Try a different search or category</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 md:left-[240px] z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[95dvh] max-h-[95dvh] rounded-[32px] sm:rounded-[40px] border-4 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div
              className="p-4 sm:p-6 flex items-center justify-between shrink-0"
              style={{ borderBottom: '1.5px solid var(--border)' }}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--blue)' }}
                >
                  <Book size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-2xl font-black truncate" style={{ color: 'var(--text)' }}>{selectedTopic.title}</h2>
                  <span className="mono-label">{selectedTopic.category}</span>
                </div>
              </div>
              <button
                onClick={() => { soundService.playBoop(); setSelectedTopic(null); }}
                className="p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all"
                style={{ background: 'var(--bg3)', color: 'var(--text2)' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 h-full">
                {/* Visual Area */}
                <div
                  className="lg:col-span-7 rounded-[24px] sm:rounded-[32px] p-2 sm:p-4 aspect-square lg:aspect-auto lg:h-full relative overflow-hidden flex items-center justify-center"
                  style={{ background: 'var(--bg2)', border: '1.5px solid var(--border)' }}
                >
                  <div className="w-full h-full relative">
                    {liveVisual?.type === VisualType.PLOT && liveVisual.plotData && <PlotVis data={liveVisual.plotData} />}
                    {liveVisual?.type === VisualType.PLOT3D && liveVisual.plot3DData && <Plot3DVis data={liveVisual.plot3DData} />}
                    {liveVisual?.type === VisualType.GRAPH && liveVisual.graphData && <GraphVis data={liveVisual.graphData} />}
                    {liveVisual?.type === VisualType.MATRIX && liveVisual.matrixData && (
                      selectedTopic.id === 'matrix-transform'
                        ? <MatrixSpaceVis data={liveVisual.matrixData} />
                        : <MatrixVis data={liveVisual.matrixData} />
                    )}
                    {liveVisual?.type === VisualType.GEOMETRY3D && liveVisual.geometry3DData && <Geometry3DVis data={liveVisual.geometry3DData} />}
                  </div>
                </div>

                {/* Controls & Explanation */}
                <div className="lg:col-span-5 flex flex-col h-full">
                  <div className="mb-6 sm:mb-8">
                    <span className="mono-label mb-3 block" style={{ color: 'var(--blue)' }}>The Concept</span>
                    <p className="text-base sm:text-lg font-bold leading-relaxed" style={{ color: 'var(--text2)' }}>
                      {selectedTopic.explanation}
                    </p>
                  </div>

                  {/* Interactive Controls */}
                  {selectedTopic.controls && selectedTopic.controls.length > 0 && (
                    <div
                      className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px]"
                      style={{ background: 'var(--bg3)', border: '1.5px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-2 mb-4 sm:mb-6">
                        <Settings2 size={14} style={{ color: 'var(--blue)' }} />
                        <span className="mono-label" style={{ color: 'var(--blue)' }}>Interactive Controls</span>
                      </div>
                      <div className="space-y-4 sm:space-y-5">
                        {selectedTopic.controls.map(control => (
                          <div key={control.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs sm:text-sm font-bold" style={{ color: 'var(--text)' }}>{control.label}</label>
                              <span
                                className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg"
                                style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--blue)' }}
                              >
                                {params[control.id]}
                              </span>
                            </div>
                            {control.type === 'slider' && (
                              <input
                                type="range"
                                min={control.min}
                                max={control.max}
                                step={control.step}
                                value={params[control.id]}
                                onChange={(e) => handleParamChange(control.id, parseFloat(e.target.value))}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                                style={{ background: 'var(--border2)' }}
                              />
                            )}
                            {control.type === 'select' && (
                              <select
                                value={params[control.id]}
                                onChange={(e) => handleParamChange(control.id, e.target.value)}
                                className="ds-input text-sm"
                              >
                                {control.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            soundService.playBoop();
                            const reset: Record<string, any> = {};
                            selectedTopic.controls?.forEach(c => reset[c.id] = c.defaultValue);
                            setParams(reset);
                          }}
                          className="flex items-center gap-2 mono-label transition-colors"
                          style={{ color: 'var(--text3)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--blue)'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'}
                        >
                          <RefreshCcw size={12} />
                          Reset Parameters
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 sm:pt-6">
                    <button
                      onClick={() => { soundService.playBoop(); setSelectedTopic(null); }}
                      className="btn-cta w-full"
                    >
                      Got it!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;
