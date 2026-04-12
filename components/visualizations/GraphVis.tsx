
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '../../types';
import { Maximize, ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';

interface GraphVisProps {
  data: GraphData;
}

const GraphVis: React.FC<GraphVisProps> = ({ data }) => {
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
    const labelColor = isDark ? "#e2e8f0" : "#64748b";
    const nodeStroke = isDark ? "#0f172a" : "#ffffff";
    const linkColor = isDark ? "#475569" : "#94a3b8";

    // Main container for zoom
    const container = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Store zoom behavior for manual control
    (svgRef.current as any).zoom = zoom;

    const simulation = d3.forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(50));

    simulationRef.current = simulation;

    svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 35)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", linkColor);

    const link = container.append("g")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", data.directed ? "url(#arrowhead)" : null);

    const nodeGroup = container.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    nodeGroup.append("circle")
      .attr("r", 28)
      .attr("fill", (d: any) => d.group === 1 ? "#58CC02" : (d.group === 2 ? "#FFC800" : "#1CB0F6"))
      .attr("stroke", nodeStroke)
      .attr("stroke-width", 3)
      .attr("class", "shadow-sm cursor-grab active:cursor-grabbing transition-colors");

    nodeGroup.append("text")
      .text((d: any) => d.label || d.id)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("fill", "white")
      .attr("font-weight", "900")
      .attr("font-size", "13px")
      .attr("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active && !isPaused) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
      
      // If paused, we need to manually update the positions because the tick won't fire
      if (isPaused) {
        d.x = event.x;
        d.y = event.y;
        
        // Update this node's visual position
        d3.select(event.sourceEvent.target.parentNode).attr("transform", `translate(${d.x},${d.y})`);
        
        // Update connected links
        link
          .filter((l: any) => l.source.id === d.id || l.target.id === d.id)
          .attr("x1", (l: any) => l.source.x)
          .attr("y1", (l: any) => l.source.y)
          .attr("x2", (l: any) => l.target.x)
          .attr("y2", (l: any) => l.target.y);
      }
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      if (!isPaused) {
        d.fx = null;
        d.fy = null;
      }
    }

    return () => { simulation.stop(); };
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
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden relative transition-colors group">
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm">
          Interactive Graph
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

export default GraphVis;
