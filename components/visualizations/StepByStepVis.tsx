import React, { useState, useRef, useEffect } from 'react';
import { StepByStepData, VisualType } from '../../types';
import { ChevronLeft, ChevronRight, Info, Volume2, VolumeX } from 'lucide-react';
import PlotVis from './PlotVis';
import Plot3DVis from './Plot3DVis';
import GraphVis from './GraphVis';
import FlowchartVis from './FlowchartVis';
import MatrixVis from './MatrixVis';
import Geometry3DVis from './Geometry3DVis';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { soundService } from '../../services/soundService';
import { ttsService } from '../../services/ttsService';
import 'katex/dist/katex.min.css';

interface StepByStepVisProps {
  data: StepByStepData;
}

const StepByStepVis: React.FC<StepByStepVisProps> = ({ data }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const stopReading = () => {
    ttsService.stop();
    setIsReading(false);
  };

  const handleRead = async (text: string) => {
    if (isReading) {
      stopReading();
      return;
    }

    // Clean text for TTS (remove LaTeX markers)
    const cleanText = text.replace(/\$\$[\s\S]*?\$\$/g, '').replace(/\$.*?\$/g, '').replace(/\*\*/g, '');

    setIsReading(true);
    try {
      await ttsService.speak(cleanText);
    } finally {
      setIsReading(false);
    }
  };

  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  const nextStep = () => {
    if (currentStep < data.steps.length - 1) {
      stopReading();
      soundService.playBoop();
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      stopReading();
      soundService.playBoop();
      setCurrentStep(currentStep - 1);
    }
  };

  const step = data.steps[currentStep];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex-1 mr-4">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 line-clamp-1">
            Step {currentStep + 1}: {step.title}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest line-clamp-1">
            {data.problem}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-brand-blue transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-slate-500 min-w-[3rem] text-center">
            {currentStep + 1} / {data.steps.length}
          </span>
          <button
            onClick={nextStep}
            disabled={currentStep === data.steps.length - 1}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-brand-blue transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Visual Aid */}
        <div className="flex-1 min-h-[300px] relative bg-slate-50 dark:bg-slate-950/50">
          {step.visual?.type === VisualType.PLOT && step.visual.plotData && <PlotVis data={step.visual.plotData} />}
          {step.visual?.type === VisualType.PLOT3D && step.visual.plot3DData && <Plot3DVis data={step.visual.plot3DData} />}
          {step.visual?.type === VisualType.GRAPH && step.visual.graphData && <GraphVis data={step.visual.graphData} />}
          {step.visual?.type === VisualType.FLOWCHART && step.visual.flowchartData && <FlowchartVis data={step.visual.flowchartData} />}
          {step.visual?.type === VisualType.MATRIX && step.visual.matrixData && <div className="h-full flex items-center justify-center"><MatrixVis data={step.visual.matrixData} /></div>}
          {step.visual?.type === VisualType.GEOMETRY3D && step.visual.geometry3DData && <Geometry3DVis data={step.visual.geometry3DData} />}
          {(!step.visual || step.visual.type === VisualType.NONE) && (
            <div className="h-full flex items-center justify-center text-slate-300 italic">
              No visual aid for this step
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="w-full md:w-80 p-6 border-l border-slate-100 dark:border-slate-800 overflow-y-auto bg-white dark:bg-slate-900 relative">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-slate-900 py-2 z-10">
            <div className="flex items-center gap-2 text-brand-blue">
              <Info size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Explanation</span>
            </div>
            <button 
              onClick={() => handleRead(step.explanation)}
              className={`p-2 rounded-xl transition-all ${isReading ? 'bg-brand-red text-white' : 'bg-slate-50 dark:bg-slate-800 text-brand-blue hover:bg-brand-blue/10'}`}
              title={isReading ? 'Stop Reading' : 'Read Aloud'}
            >
              {isReading ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => {
                  // This is a bit complex to highlight within Markdown sentences, 
                  // so we'll just render it normally for now.
                  // Highlighting is better handled in the main expanded view.
                  return <p>{children}</p>;
                }
              }}
            >
              {step.explanation}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepByStepVis;
