import * as math from 'mathjs';
import {
  VisualType,
  VisualContent,
  MathResponseSchema,
  PlotPoint,
  TreeData,
  BentoData,
  ParticleData,
  TreeNode,
  BentoItem,
  ParticleNode,
  ParticleLink,
} from '../types';

/**
 * MathEngine handles local computation for visualizations.
 * It translates AI-generated formulas and structures into concrete data.
 */
export class MathEngine {
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
              xRange: [schema.plot3DXMin ?? -5, schema.plot3DXMax ?? 5],
              yRange: [schema.plot3DYMin ?? -5, schema.plot3DYMax ?? 5],
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
              matrix: this.normalizeMatrix(schema.matrixRows),
              label: 'Matrix Result'
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

        case VisualType.BENTO:
          if (schema.bentoItems) {
            content.bentoData = {
              title: schema.bentoTitle || 'Bento Board',
              subtitle: schema.bentoSubtitle,
              items: this.normalizeBentoItems(schema.bentoItems)
            };
          }
          break;

        case VisualType.TREE:
          if (schema.treeNodes || schema.graphNodes) {
            const nodes = schema.treeNodes || (schema.graphNodes as any[]);
            content.treeData = {
              title: schema.treeTitle || 'Tree View',
              subtitle: schema.treeSubtitle,
              rootId: schema.treeRootId,
              nodes: this.normalizeTreeNodes(nodes)
            };
          }
          break;

        case VisualType.PARTICLE:
          if (schema.particleNodes) {
            content.particleData = {
              title: schema.particleTitle || 'Particle Field',
              subtitle: schema.particleSubtitle,
              particles: this.normalizeParticleNodes(schema.particleNodes),
              links: this.normalizeParticleLinks(schema.particleLinks || [])
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
      console.error('MathEngine processing error:', error);
      content.type = VisualType.NONE;
    }

    return content;
  }

  private static normalizeMatrix(matrix: number[][]): number[][] {
    const maxCols = Math.max(...matrix.map(row => row.length), 0);
    return matrix.map(row => {
      const normalized = [...row];
      while (normalized.length < maxCols) normalized.push(0);
      return normalized;
    });
  }

  private static normalizeBentoItems(items: BentoItem[]): BentoItem[] {
    return items
      .filter(item => !!item?.title)
      .slice(0, 12)
      .map(item => ({
        title: item.title,
        description: item.description,
        accent: item.accent,
        metric: item.metric,
      }));
  }

  private static normalizeTreeNodes(nodes: (TreeNode | any)[]): TreeNode[] {
    return nodes
      .filter(node => !!node?.id && !!node?.label)
      .map(node => ({
        id: String(node.id),
        label: String(node.label),
        parentId: node.parentId ? String(node.parentId) : undefined,
        note: node.note ? String(node.note) : undefined,
        group: typeof node.group === 'number' ? node.group : undefined,
      }));
  }

  private static normalizeParticleNodes(nodes: (ParticleNode | any)[]): ParticleNode[] {
    return nodes
      .filter(node => !!node?.id)
      .slice(0, 120)
      .map(node => ({
        id: String(node.id),
        label: node.label ? String(node.label) : undefined,
        x: typeof node.x === 'number' ? node.x : undefined,
        y: typeof node.y === 'number' ? node.y : undefined,
        weight: typeof node.weight === 'number' ? node.weight : undefined,
        group: typeof node.group === 'number' ? node.group : undefined,
      }));
  }

  private static normalizeParticleLinks(links: (ParticleLink | any)[]): ParticleLink[] {
    return links
      .filter(link => !!link?.source && !!link?.target)
      .slice(0, 200)
      .map(link => ({
        source: String(link.source),
        target: String(link.target),
        strength: typeof link.strength === 'number' ? link.strength : undefined,
      }));
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
      console.error('Formula evaluation error:', e);
    }

    return points;
  }
}
