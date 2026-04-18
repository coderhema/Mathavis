import { Message, VisualType, MathResponseSchema } from '../types';
import { MathEngine } from './MathEngine';

const env = (import.meta as any).env as Record<string, string | undefined> | undefined;
const modelId = env?.GROQ_MODEL || env?.VITE_GROQ_MODEL || 'groq-compound';
const visionModelId = env?.GROQ_VISION_MODEL || env?.VITE_GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview';
const groqApiKey =
  env?.GROQ_API_KEY ||
  env?.GROQAPI_KEY ||
  env?.VITE_GROQ_API_KEY ||
  env?.API_KEY ||
  env?.GEMINI_API_KEY;
const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

const validVisualTypes = new Set(Object.values(VisualType));

const systemInstruction = `
You are Professor Cluck, a precise and enthusiastic math tutor.
Use the full conversation context. When the user refers to "this", "that", "same", "again", or a prior diagram, keep the same topic, notation, ranges, labels, and visual settings unless the user explicitly changes them.

Return JSON only. Always include explanation, visualType, and suggestedActions.
Set visualType using exact uppercase values only.

Use these visualization rules:
1. PLOT for single-variable functions. Provide plotFormula, and optionally plotDomainMin and plotDomainMax.
2. PLOT3D for multivariable surfaces. Provide plot3DFormula plus plot3DXMin, plot3DXMax, plot3DYMin, and plot3DYMax when relevant.
3. GRAPH for network graphs, dependency graphs, knowledge graphs, and relationship maps. Use graphMode: "network". Provide graphNodes, graphLinks, and graphDirected when direction matters.
4. FLOWCHART for algorithms and procedures. Use graphMode: "flowchart". Use graphNodes with node types start, step, decision, end, plus graphLinks.
5. MATRIX for linear algebra matrices and transformations. Provide matrixRows as a rectangular array.
6. GEOMETRY3D for solid shapes.
7. STEPS for step-by-step solutions. Each step must have a title, explanation, and visualType.
8. QUIZ for multiple choice questions.
9. VECTOR_FIELD for vector fields.
10. UNIT_CIRCLE for trig visuals.
11. COMPLEX_PLANE for complex numbers.
12. VENN_DIAGRAM for set relationships.
13. BENTO for concise summary dashboards, feature comparisons, grouped takeaways, and compact overviews. Provide bentoTitle and bentoItems.
14. TREE for hierarchies, recursion, org charts, folder trees, and dependency trees. Provide treeTitle, treeRootId, and treeNodes.
15. PARTICLE for clusters, swarms, statistical clouds, networks with motion, or abstract systems. Provide particleTitle, particleNodes, and optional particleLinks.

For graph/network visuals, do not mix in flowchart node types.
For flowcharts, do not use network-style nodes without graphMode: "flowchart".
For 3D visuals, make sure the formula and ranges are internally consistent.
For matrices, output a clean rectangular matrix with numbers only.

If the user asks to show, draw, plot, visualize, or compare multiple ideas, choose the most appropriate visualization type and provide the exact fields needed by the frontend.
`;

const isRateLimitLike = (error: any, status?: number) => {
  const errorString = typeof error === 'string' ? error : JSON.stringify(error);
  return (
    status === 429 ||
    error?.status === 429 ||
    error?.error?.code === 429 ||
    errorString.includes('429') ||
    errorString.includes('RESOURCE_EXHAUSTED') ||
    errorString.includes('quota')
  );
};

const isRetryableStatus = (status?: number) => {
  return status !== undefined && [408, 425, 429, 500, 502, 503, 504].includes(status);
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const buildContentParts = (text: string, image?: string) => {
  const parts: any[] = [{ type: 'text', text }];
  if (image) {
    parts.push({ type: 'image_url', image_url: { url: image } });
  }
  return parts;
};

const extractContentText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        if (part && typeof part.content === 'string') return part.content;
        return '';
      })
      .join('');
  }
  return '';
};

const parseJsonResponse = (responseText: string): Partial<MathResponseSchema> => {
  const cleaned = responseText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '');

  return JSON.parse(cleaned) as Partial<MathResponseSchema>;
};

const asStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) return fallback;
  const result = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return result.length > 0 ? result : fallback;
};

const normalizeVisualType = (value: unknown): VisualType => {
  const raw = typeof value === 'string' ? value.toUpperCase() : '';
  if (raw && validVisualTypes.has(raw as VisualType)) return raw as VisualType;
  return VisualType.NONE;
};

const inferVisualType = (data: Partial<MathResponseSchema>): VisualType => {
  if (data.graphMode === 'flowchart') return VisualType.FLOWCHART;
  if (data.graphMode === 'tree') return VisualType.TREE;
  if (data.graphMode === 'network') return VisualType.GRAPH;

  const explicit = normalizeVisualType(data.visualType);
  if (explicit !== VisualType.NONE) return explicit;

  if (data.stepByStep?.steps?.length) return VisualType.STEPS;
  if (data.quiz) return VisualType.QUIZ;
  if (data.bentoItems?.length) return VisualType.BENTO;
  if (data.treeNodes?.length) return VisualType.TREE;
  if (data.particleNodes?.length) return VisualType.PARTICLE;
  if (data.vennSets?.length) return VisualType.VENN_DIAGRAM;
  if (data.complexReal !== undefined && data.complexImaginary !== undefined) return VisualType.COMPLEX_PLANE;
  if (data.unitCircleAngle !== undefined) return VisualType.UNIT_CIRCLE;
  if (data.vectorFieldFormulaX && data.vectorFieldFormulaY) return VisualType.VECTOR_FIELD;
  if (data.geometryShape) return VisualType.GEOMETRY3D;
  if (data.matrixRows?.length) return VisualType.MATRIX;
  if (data.graphNodes?.length) return VisualType.GRAPH;
  if (data.plot3DFormula) return VisualType.PLOT3D;
  if (data.plotFormula) return VisualType.PLOT;

  return VisualType.NONE;
};

const normalizeResponse = (data: Partial<MathResponseSchema>): MathResponseSchema => {
  const visualType = inferVisualType(data);

  return {
    explanation: typeof data.explanation === 'string' && data.explanation.trim().length > 0
      ? data.explanation
      : 'I could not generate a valid response.',
    visualType,
    suggestedActions: asStringArray(data.suggestedActions, ['Explain more', 'Show an example']),
    graphMode: data.graphMode,
    plotFormula: typeof data.plotFormula === 'string' ? data.plotFormula : undefined,
    plotDomainMin: typeof data.plotDomainMin === 'number' ? data.plotDomainMin : undefined,
    plotDomainMax: typeof data.plotDomainMax === 'number' ? data.plotDomainMax : undefined,
    plot3DFormula: typeof data.plot3DFormula === 'string' ? data.plot3DFormula : undefined,
    plot3DXMin: typeof data.plot3DXMin === 'number' ? data.plot3DXMin : undefined,
    plot3DXMax: typeof data.plot3DXMax === 'number' ? data.plot3DXMax : undefined,
    plot3DYMin: typeof data.plot3DYMin === 'number' ? data.plot3DYMin : undefined,
    plot3DYMax: typeof data.plot3DYMax === 'number' ? data.plot3DYMax : undefined,
    graphNodes: Array.isArray(data.graphNodes) ? data.graphNodes : undefined,
    graphLinks: Array.isArray(data.graphLinks) ? data.graphLinks : undefined,
    graphDirected: typeof data.graphDirected === 'boolean' ? data.graphDirected : undefined,
    matrixRows: Array.isArray(data.matrixRows) ? data.matrixRows : undefined,
    geometryShape: typeof data.geometryShape === 'string' ? data.geometryShape : undefined,
    geometryParams: data.geometryParams,
    vectorFieldFormulaX: typeof data.vectorFieldFormulaX === 'string' ? data.vectorFieldFormulaX : undefined,
    vectorFieldFormulaY: typeof data.vectorFieldFormulaY === 'string' ? data.vectorFieldFormulaY : undefined,
    unitCircleAngle: typeof data.unitCircleAngle === 'number' ? data.unitCircleAngle : undefined,
    complexReal: typeof data.complexReal === 'number' ? data.complexReal : undefined,
    complexImaginary: typeof data.complexImaginary === 'number' ? data.complexImaginary : undefined,
    vennSets: Array.isArray(data.vennSets) ? data.vennSets : undefined,
    vennIntersections: Array.isArray(data.vennIntersections) ? data.vennIntersections : undefined,
    quiz: data.quiz && typeof data.quiz.question === 'string' ? data.quiz : undefined,
    stepByStep: data.stepByStep && Array.isArray(data.stepByStep.steps)
      ? {
          problem: typeof data.stepByStep.problem === 'string' ? data.stepByStep.problem : '',
          steps: data.stepByStep.steps
            .filter((step: any) => step && typeof step.title === 'string' && typeof step.explanation === 'string')
            .map((step: any) => ({
              title: step.title,
              explanation: step.explanation,
              visualType: typeof step.visualType === 'string' ? step.visualType : 'NONE',
              graphMode: step.graphMode,
              plotFormula: typeof step.plotFormula === 'string' ? step.plotFormula : undefined,
              plotDomainMin: typeof step.plotDomainMin === 'number' ? step.plotDomainMin : undefined,
              plotDomainMax: typeof step.plotDomainMax === 'number' ? step.plotDomainMax : undefined,
              plot3DFormula: typeof step.plot3DFormula === 'string' ? step.plot3DFormula : undefined,
              plot3DXMin: typeof step.plot3DXMin === 'number' ? step.plot3DXMin : undefined,
              plot3DXMax: typeof step.plot3DXMax === 'number' ? step.plot3DXMax : undefined,
              plot3DYMin: typeof step.plot3DYMin === 'number' ? step.plot3DYMin : undefined,
              plot3DYMax: typeof step.plot3DYMax === 'number' ? step.plot3DYMax : undefined,
              graphNodes: Array.isArray(step.graphNodes) ? step.graphNodes : undefined,
              graphLinks: Array.isArray(step.graphLinks) ? step.graphLinks : undefined,
              graphDirected: typeof step.graphDirected === 'boolean' ? step.graphDirected : undefined,
              matrixRows: Array.isArray(step.matrixRows) ? step.matrixRows : undefined,
              geometryShape: typeof step.geometryShape === 'string' ? step.geometryShape : undefined,
              geometryParams: step.geometryParams,
              vectorFieldFormulaX: typeof step.vectorFieldFormulaX === 'string' ? step.vectorFieldFormulaX : undefined,
              vectorFieldFormulaY: typeof step.vectorFieldFormulaY === 'string' ? step.vectorFieldFormulaY : undefined,
              unitCircleAngle: typeof step.unitCircleAngle === 'number' ? step.unitCircleAngle : undefined,
              complexReal: typeof step.complexReal === 'number' ? step.complexReal : undefined,
              complexImaginary: typeof step.complexImaginary === 'number' ? step.complexImaginary : undefined,
              vennSets: Array.isArray(step.vennSets) ? step.vennSets : undefined,
              vennIntersections: Array.isArray(step.vennIntersections) ? step.vennIntersections : undefined,
              quiz: step.quiz && typeof step.quiz.question === 'string' ? step.quiz : undefined,
              bentoTitle: typeof step.bentoTitle === 'string' ? step.bentoTitle : undefined,
              bentoSubtitle: typeof step.bentoSubtitle === 'string' ? step.bentoSubtitle : undefined,
              bentoItems: Array.isArray(step.bentoItems) ? step.bentoItems : undefined,
              treeTitle: typeof step.treeTitle === 'string' ? step.treeTitle : undefined,
              treeSubtitle: typeof step.treeSubtitle === 'string' ? step.treeSubtitle : undefined,
              treeRootId: typeof step.treeRootId === 'string' ? step.treeRootId : undefined,
              treeNodes: Array.isArray(step.treeNodes) ? step.treeNodes : undefined,
              particleTitle: typeof step.particleTitle === 'string' ? step.particleTitle : undefined,
              particleSubtitle: typeof step.particleSubtitle === 'string' ? step.particleSubtitle : undefined,
              particleNodes: Array.isArray(step.particleNodes) ? step.particleNodes : undefined,
              particleLinks: Array.isArray(step.particleLinks) ? step.particleLinks : undefined,
            }))
        }
      : undefined,
    bentoTitle: typeof data.bentoTitle === 'string' ? data.bentoTitle : undefined,
    bentoSubtitle: typeof data.bentoSubtitle === 'string' ? data.bentoSubtitle : undefined,
    bentoItems: Array.isArray(data.bentoItems) ? data.bentoItems : undefined,
    treeTitle: typeof data.treeTitle === 'string' ? data.treeTitle : undefined,
    treeSubtitle: typeof data.treeSubtitle === 'string' ? data.treeSubtitle : undefined,
    treeRootId: typeof data.treeRootId === 'string' ? data.treeRootId : undefined,
    treeNodes: Array.isArray(data.treeNodes) ? data.treeNodes : undefined,
    particleTitle: typeof data.particleTitle === 'string' ? data.particleTitle : undefined,
    particleSubtitle: typeof data.particleSubtitle === 'string' ? data.particleSubtitle : undefined,
    particleNodes: Array.isArray(data.particleNodes) ? data.particleNodes : undefined,
    particleLinks: Array.isArray(data.particleLinks) ? data.particleLinks : undefined,
  };
};

export const sendMessageToGemini = async (
  history: Message[],
  userMessage: string,
  imageBase64?: string,
  retries = 3
): Promise<Message> => {
  try {
    if (!groqApiKey) {
      throw new Error('Missing GROQ_API_KEY');
    }

    const messages = [
      { role: 'system', content: systemInstruction },
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.image ? buildContentParts(msg.text, msg.image) : msg.text
      })),
      {
        role: 'user',
        content: imageBase64 ? buildContentParts(userMessage, imageBase64) : userMessage
      }
    ];

    const response = await fetch(groqApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: imageBase64 ? visionModelId : modelId,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const error = { status: response.status, message: errorText };
      if (isRetryableStatus(response.status) && retries > 0) {
        const delay = Math.pow(2, 4 - retries) * 1500;
        console.log(`Groq request hit ${response.status}. Retrying in ${delay}ms... (${retries} retries left)`);
        await sleep(delay);
        return sendMessageToGemini(history, userMessage, imageBase64, retries - 1);
      }
      throw error;
    }

    const payload = await response.json();
    const responseText = extractContentText(payload?.choices?.[0]?.message?.content);
    if (!responseText) {
      throw new Error('No response from Groq');
    }

    const data = normalizeResponse(parseJsonResponse(responseText));
    const visual = MathEngine.processResponse(data);

    return {
      id: Date.now().toString(),
      role: 'model',
      text: data.explanation,
      visual,
      suggestedActions: data.suggestedActions,
      timestamp: Date.now()
    };
  } catch (error: any) {
    const status = error?.status;
    if (isRateLimitLike(error, status)) {
      if (retries > 0) {
        const delay = Math.pow(2, 4 - retries) * 1500;
        console.log(`Groq rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await sleep(delay);
        return sendMessageToGemini(history, userMessage, imageBase64, retries - 1);
      }

      return {
        id: Date.now().toString(),
        role: 'model',
        text: "Squawk! I'm out of math energy right now. Please wait a minute and try again!",
        visual: { type: VisualType.NONE },
        suggestedActions: ['Try again in a minute', 'Check my progress'],
        timestamp: Date.now()
      };
    }

    console.error('Groq API Error:', error);

    return {
      id: Date.now().toString(),
      role: 'model',
      text: "Squawk! I'm having trouble connecting to the math universe. Please try again later.",
      visual: { type: VisualType.NONE },
      suggestedActions: ['Try again'],
      timestamp: Date.now()
    };
  }
};
