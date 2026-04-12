
import * as math from 'mathjs';
import { VisualType, VisualContent, MathResponseSchema, PlotPoint } from '../types';

/**
 * MathEngine handles local computation for visualizations.
 * It translates AI-generated formulas and structures into concrete data points.
 */
export class MathEngine {
  /**
   * Processes the raw AI response schema into a rich VisualContent object.
   */
  static processResponse(schema: MathResponseSchema): VisualContent {
    const type = schema.visualType as VisualType;
    const content: VisualContent = { type };

    try {
      switch (type) {
        case VisualType.PLOT:
          if (schema.plotFormula) {
            content.plotData = {
              label: schema.plotFormula,
              domain: [schema.plotDomainMin ?? -10, schema.plotDomainMax ?? 10],
              points: this.generatePlotPoints(schema.plotFormula, schema.plotDomainMin ?? -10, schema.plotDomainMax ?? 10)
            };
          }
          break;

        case VisualType.PLOT3D:
          if (schema.plot3DFormula) {
            content.plot3DData = {
              formula: schema.plot3DFormula,
              xRange: [-5, 5],
              yRange: [-5, 5],
              label: schema.plot3DFormula
            };
          }
          break;

        case VisualType.FLOWCHART:
          if (schema.graphNodes) {
            content.flowchartData = {
              nodes: schema.graphNodes.map(n => ({
                id: n.id,
                label: n.label,
                type: (n.type as any) || 'step'
              })),
              links: schema.graphLinks || []
            };
          }
          break;

        case VisualType.GRAPH:
          if (schema.graphNodes) {
            content.graphData = {
              nodes: schema.graphNodes.map(n => ({
                id: n.id,
                label: n.label,
                group: n.group
              })),
              links: schema.graphLinks || [],
              directed: schema.graphDirected
            };
          }
          break;

        case VisualType.MATRIX:
          if (schema.matrixRows) {
            content.matrixData = {
              matrix: schema.matrixRows,
              label: "Matrix Result"
            };
          }
          break;
          
        case VisualType.GEOMETRY3D:
          if (schema.geometryShape) {
            content.geometry3DData = {
              shape: schema.geometryShape as any,
              params: schema.geometryParams,
              label: schema.geometryShape
            };
          }
          break;

        case VisualType.VECTOR_FIELD:
          if (schema.vectorFieldFormulaX && schema.vectorFieldFormulaY) {
            content.vectorFieldData = {
              formulaX: schema.vectorFieldFormulaX,
              formulaY: schema.vectorFieldFormulaY,
              domain: [-5, 5],
              range: [-5, 5]
            };
          }
          break;

        case VisualType.UNIT_CIRCLE:
          if (schema.unitCircleAngle !== undefined) {
            content.unitCircleData = {
              angle: schema.unitCircleAngle,
              showSine: true,
              showCosine: true,
              showTangent: true
            };
          }
          break;

        case VisualType.COMPLEX_PLANE:
          if (schema.complexReal !== undefined && schema.complexImaginary !== undefined) {
            content.complexPlaneData = {
              real: schema.complexReal,
              imaginary: schema.complexImaginary,
              showPolar: true
            };
          }
          break;

        case VisualType.VENN_DIAGRAM:
          if (schema.vennSets) {
            content.vennDiagramData = {
              sets: schema.vennSets,
              intersections: schema.vennIntersections || []
            };
          }
          break;

        case VisualType.QUIZ:
          if (schema.quiz) {
            content.quizData = {
              question: schema.quiz.question,
              options: schema.quiz.options,
              explanation: schema.quiz.explanation
            };
          }
          break;

        case VisualType.STEPS:
          if (schema.stepByStep) {
            content.stepByStepData = {
              problem: schema.stepByStep.problem,
              steps: schema.stepByStep.steps.map(s => ({
                title: s.title,
                explanation: s.explanation,
                visual: this.processResponse(s as any)
              }))
            };
          }
          break;
      }
    } catch (error) {
      console.error("MathEngine processing error:", error);
      content.type = VisualType.NONE;
    }

    return content;
  }

  private static generatePlotPoints(formula: string, min: number, max: number): PlotPoint[] {
    const points: PlotPoint[] = [];
    const step = (max - min) / 100;
    
    try {
      const node = math.parse(formula);
      const code = node.compile();
      
      for (let x = min; x <= max; x += step) {
        const scope = { x, Math };
        const y = code.evaluate(scope);
        if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
          points.push({ x, y });
        }
      }
    } catch (e) {
      console.error("Formula evaluation error:", e);
    }
    
    return points;
  }
}
