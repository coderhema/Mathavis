
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FlowchartData } from '../../types';
import { Maximize, Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';

interface FlowchartVisProps {
  data: FlowchartData;
}

const FlowchartVis: React.FC<FlowchartVisProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const isDark = document.documentElement.classList.contains('dark');
    const linkColor = isDark ? "#475569" : "#cbd5e1";

    const container = svg.append("g");

    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Store zoom behavior for manual control
    (svgRef.current as any).zoom = zoom;

    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("y", d3.forceY().strength(0.05))
      .force("x", d3.forceX().strength(0.05));

    simulationRef.current = simulation;

    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 65)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", linkColor);

    const link = container.append("g")
      .selectAll("g")
      .data(data.links)
      .join("g");

    link.append("line")
      .attr("stroke", linkColor)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    link.append("text")
        .text(d => d.label || "")
        .attr("fill", isDark ? "#94a3b8" : "#64748b")
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("dy", -5);

    const node = container.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", (e, d) => { if (!e.active && !isPaused) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.each(function(d: any) {
      const g = d3.select(this);
      const label = d.label;
      
      if (d.type === 'decision') {
          g.append("path")
            .attr("d", "M 0 -35 L 50 0 L 0 35 L -50 0 Z")
            .attr("fill", "#FFC800")
            .attr("stroke", "white")
            .attr("stroke-width", 3);
      } else if (d.type === 'start' || d.type === 'end') {
          g.append("rect")
            .attr("x", -50).attr("y", -20).attr("width", 100).attr("height", 40).attr("rx", 20)
            .attr("fill", d.type === 'start' ? "#58CC02" : "#FF4B4B")
            .attr("stroke", "white").attr("stroke-width", 3);
      } else {
          g.append("rect")
            .attr("x", -55).attr("y", -25).attr("width", 110).attr("height", 50).attr("rx", 12)
            .attr("fill", "#1CB0F6")
            .attr("stroke", "white").attr("stroke-width", 3);
      }

      g.append("text")
        .text(label)
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("fill", "white")
        .attr("font-weight", "900")
        .attr("font-size", "11px")
        .attr("pointer-events", "none");
    });

    simulation.on("tick", () => {
      link.select("line")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
        
      link.select("text")
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [data]);

  useEffect(() => {
    if (simulationRef.current) {
      if (isPaused) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.restart();
      }
    }
  }, [isPaused]);

  const handleResetZoom = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(
        ((svgRef.current as any).zoom || d3.zoom()).transform as any, 
        d3.zoomIdentity
      );
    }
  };

  const handleZoom = (delta: number) => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        ((svgRef.current as any).zoom || d3.zoom()).scaleBy as any, 
        delta
      );
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden transition-colors relative group">
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm">
            Process Flow
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-blue transition-colors shadow-sm"
              title={isPaused ? "Resume Simulation" : "Pause Simulation"}
            >
              {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
            </button>
            <button onClick={() => handleZoom(1.5)} className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-blue transition-colors shadow-sm" title="Zoom In">
               <ZoomIn size={14} />
            </button>
            <button onClick={() => handleZoom(0.6)} className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-blue transition-colors shadow-sm" title="Zoom Out">
               <ZoomOut size={14} />
            </button>
            <button onClick={handleResetZoom} className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-blue transition-colors shadow-sm" title="Reset View">
               <Maximize size={14} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 pointer-events-none">
          Pinch or Scroll to Zoom • Drag to Pan
        </div>
        <svg ref={svgRef} className="w-full h-full cursor-all-scroll" />
    </div>
  );
};

export default FlowchartVis;
