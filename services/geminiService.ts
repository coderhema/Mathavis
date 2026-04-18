import { Message, VisualType, MathResponseSchema } from '../types';
import { MathEngine } from './MathEngine';

const env = (import.meta as any).env as Record<string, string | undefined> | undefined;
const modelId = env?.GROQ_MODEL || env?.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const visionModelId = env?.GROQ_VISION_MODEL || env?.VITE_GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview';
const groqApiKey =
  env?.GROQ_API_KEY ||
  env?.GROQAPI_KEY ||
  env?.VITE_GROQ_API_KEY ||
  env?.API_KEY ||
  env?.GEMINI_API_KEY;
const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

const validVisualTypes = new Set(Object.values(VisualType));
const validGraphModes = new Set(['network', 'flowchart', 'tree']);

const systemInstruction = `
You are Professor Cluck, an expert math tutor that answers with exact JSON only.
Use the entire conversation context. If the user refers to "this", "that", "same", "again", or an earlier visual, preserve the earlier topic, labels, notation, ranges, and settings unless the user explicitly changes them.

Output contract:
- Return valid JSON only. No markdown, no code fences, no commentary.
- Always include explanation, visualType, and suggestedActions.
- Use exact uppercase visualType values from the schema.
- Include only the fields relevant to the chosen visual.
- When a visual is needed, make the JSON complete enough for the frontend to render it without guessing.

Visualization rules:
1. PLOT: single-variable functions. Provide plotFormula. Add plotDomainMin and plotDomainMax when helpful.
2. PLOT3D: multivariable surfaces. Provide plot3DFormula and, when possible, plot3DXMin, plot3DXMax, plot3DYMin, plot3DYMax.
3. GRAPH: network / dependency / relationship diagrams. Use graphMode: "network". Provide graphNodes, graphLinks, and graphDirected when direction matters.
4. FLOWCHART: algorithms and processes. Use graphMode: "flowchart". Use graphNodes with node types start, step, decision, end, plus graphLinks.
5. TREE: hierarchies, recursion, org charts, folder trees. Use graphMode: "tree". Provide treeTitle, treeRootId, and treeNodes. If needed, treeNodes may also be expressed with graphNodes plus parentId.
6. MATRIX: linear algebra. matrixRows must be a rectangular numeric array. Do not emit strings in matrixRows.
7. GEOMETRY3D: 3D solids and shapes.
8. STEPS: step-by-step solutions. Every step must have title, explanation, and visualType.
9. QUIZ: multiple-choice practice.
10. VECTOR_FIELD: provide vectorFieldFormulaX and vectorFieldFormulaY.
11. UNIT_CIRCLE: provide unitCircleAngle in degrees.
12. COMPLEX_PLANE: provide complexReal and complexImaginary.
13. VENN_DIAGRAM: provide vennSets and vennIntersections.
14. BENTO: concise summary dashboards, grouped takeaways, comparisons. Provide bentoTitle and bentoItems.
15. PARTICLE: clusters, swarms, abstract motion, emergent systems. Provide particleTitle and particleNodes, plus particleLinks if relevant.

Precision rules:
- Prefer the visual that best matches the user’s intent. Do not force GRAPH when the user asked for a matrix, surface, or tree.
- For graph and tree outputs, keep node ids stable and human-readable.
- For 3D outputs, keep formulas consistent with the selected domain.
- For matrices, keep rows equal length and values numeric.
- For nested step-by-step visuals, keep each step’s visualType and supporting fields internally consistent.
- If no visual is needed, set visualType to NONE and keep suggestedActions helpful.
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

const stripCodeFences = (text: string) => text
  .trim()
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/```\s*$/i, '');

const extractJsonCandidate = (text: string): string => {
  const cleaned = stripCodeFences(text);
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

const parseJsonResponse = (responseText: string): Partial<MathResponseSchema> => {
  const candidate = extractJsonCandidate(responseText);
  try {
    return JSON.parse(candidate) as Partial<MathResponseSchema>;
  } catch {
    const relaxed = candidate
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');
    return JSON.parse(relaxed) as Partial<MathResponseSchema>;
  }
};

const asStringArray = (value: unknown, fallback: string[] = []): string[] => {
  if (!Array.isArray(value)) return fallback;
  const result = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return result.length > 0 ? result : fallback;
};

const cleanString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

const normalizeVisualType = (value: unknown): VisualType => {
  const raw = typeof value === 'string' ? value.toUpperCase().trim() : '';
  if (raw && validVisualTypes.has(raw as VisualType)) return raw as VisualType;
  return VisualType.NONE;
};

const normalizeGraphMode = (value: unknown): 'network' | 'flowchart' | 'tree' | undefined => {
  const raw = typeof value === 'string' ? value.toLowerCase().trim() : '';
  return validGraphModes.has(raw) ? (raw as 'network' | 'flowchart' | 'tree') : undefined;
};

const normalizeMatrixRows = (rows: unknown): number[][] | undefined => {
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  const normalized = rows
    .filter((row): row is any[] => Array.isArray(row))
    .map(row => row.map(cell => (typeof cell === 'number' && Number.isFinite(cell) ? cell : Number(cell))))
    .filter(row => row.every(cell => typeof cell === 'number' && Number.isFinite(cell)));
  if (!normalized.length) return undefined;
  const maxCols = Math.max(...normalized.map(row => row.length), 0);
  if (!maxCols) return undefined;
  return normalized.map(row => {
    const next = [...row];
    while (next.length < maxCols) next.push(0);
    return next;
  });
};

const inferVisualType = (data: Partial<MathResponseSchema>): VisualType => {
  const explicit = normalizeVisualType(data.visualType);
  if (explicit !== VisualType.NONE) return explicit;

  const graphMode = normalizeGraphMode(data.graphMode);
  if (graphMode === 'flowchart') return VisualType.FLOWCHART;
  if (graphMode === 'tree') return VisualType.TREE;
  if (graphMode === 'network') return VisualType.GRAPH;

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
  if (normalizeMatrixRows(data.matrixRows)?.length) return VisualType.MATRIX;
  if (data.graphNodes?.length) {
    const hasTreeFields = data.graphNodes.some(node => typeof node.parentId === 'string');
    const hasFlowFields = data.graphNodes.some(node => typeof node.type === 'string');
    if (hasTreeFields) return VisualType.TREE;
    if (hasFlowFields) return VisualType.FLOWCHART;
    return VisualType.GRAPH;
  }
  if (data.plot3DFormula) return VisualType.PLOT3D;
  if (data.plotFormula) return VisualType.PLOT;

  return VisualType.NONE;
};

const normalizeNodes = (nodes: any[]): any[] | undefined => {
  if (!Array.isArray(nodes)) return undefined;
  const cleaned = nodes
    .filter(node => node && typeof node.id === 'string')
    .map(node => ({
      id: node.id,
      label: cleanString(node.label) ?? node.id,
      group: typeof node.group === 'number' ? node.group : undefined,
      type: cleanString(node.type),
      parentId: cleanString(node.parentId),
      note: cleanString(node.note),
    }));
  return cleaned.length ? cleaned : undefined;
};

const normalizeLinks = (links: any[]): any[] | undefined => {
  if (!Array.isArray(links)) return undefined;
  const cleaned = links
    .filter(link => link && typeof link.source === 'string' && typeof link.target === 'string')
    .map(link => ({
      source: link.source,
      target: link.target,
      label: cleanString(link.label),
      value: typeof link.value === 'number' ? link.value : undefined,
    }));
  return cleaned.length ? cleaned : undefined;
};

const normalizeResponse = (data: Partial<MathResponseSchema>): MathResponseSchema => {
  const visualType = inferVisualType(data);
  const matrixRows = normalizeMatrixRows(data.matrixRows);
  const graphNodes = normalizeNodes(data.graphNodes as any[]);
  const graphLinks = normalizeLinks(data.graphLinks as any[]);
  const stepByStep = data.stepByStep && Array.isArray(data.stepByStep.steps)
    ? {
        problem: cleanString(data.stepByStep.problem) ?? '',
        steps: data.stepByStep.steps
          .filter((step: any) => step && typeof step.title === 'string' && typeof step.explanation === 'string')
          .map((step: any) => ({
            title: step.title,
            explanation: step.explanation,
            visualType: typeof step.visualType === 'string' ? step.visualType.toUpperCase() : 'NONE',
            graphMode: normalizeGraphMode(step.graphMode),
            plotFormula: cleanString(step.plotFormula),
            plotDomainMin: typeof step.plotDomainMin === 'number' ? step.plotDomainMin : undefined,
            plotDomainMax: typeof step.plotDomainMax === 'number' ? step.plotDomainMax : undefined,
            plot3DFormula: cleanString(step.plot3DFormula),
            plot3DXMin: typeof step.plot3DXMin === 'number' ? step.plot3DXMin : undefined,
            plot3DXMax: typeof step.plot3DXMax === 'number' ? step.plot3DXMax : undefined,
            plot3DYMin: typeof step.plot3DYMin === 'number' ? step.plot3DYMin : undefined,
            plot3DYMax: typeof step.plot3DYMax === 'number' ? step.plot3DYMax : undefined,
            graphNodes: normalizeNodes(step.graphNodes),
            graphLinks: normalizeLinks(step.graphLinks),
            graphDirected: typeof step.graphDirected === 'boolean' ? step.graphDirected : undefined,
            matrixRows: normalizeMatrixRows(step.matrixRows),
            geometryShape: cleanString(step.geometryShape),
            geometryParams: step.geometryParams,
            vectorFieldFormulaX: cleanString(step.vectorFieldFormulaX),
            vectorFieldFormulaY: cleanString(step.vectorFieldFormulaY),
            unitCircleAngle: typeof step.unitCircleAngle === 'number' ? step.unitCircleAngle : undefined,
            complexReal: typeof step.complexReal === 'number' ? step.complexReal : undefined,
            complexImaginary: typeof step.complexImaginary === 'number' ? step.complexImaginary : undefined,
            vennSets: Array.isArray(step.vennSets) ? step.vennSets : undefined,
            vennIntersections: Array.isArray(step.vennIntersections) ? step.vennIntersections : undefined,
            quiz: step.quiz && typeof step.quiz.question === 'string' ? step.quiz : undefined,
            bentoTitle: cleanString(step.bentoTitle),
            bentoSubtitle: cleanString(step.bentoSubtitle),
            bentoItems: Array.isArray(step.bentoItems) ? step.bentoItems : undefined,
            treeTitle: cleanString(step.treeTitle),
            treeSubtitle: cleanString(step.treeSubtitle),
            treeRootId: cleanString(step.treeRootId),
            treeNodes: Array.isArray(step.treeNodes) ? step.treeNodes : undefined,
            particleTitle: cleanString(step.particleTitle),
            particleSubtitle: cleanString(step.particleSubtitle),
            particleNodes: Array.isArray(step.particleNodes) ? step.particleNodes : undefined,
            particleLinks: Array.isArray(step.particleLinks) ? step.particleLinks : undefined,
          }))
      }
    : undefined;

  return {
    explanation: cleanString(data.explanation) ?? 'I could not generate a valid response.',
    visualType,
    suggestedActions: asStringArray(data.suggestedActions, ['Explain more', 'Show an example']),
    graphMode: normalizeGraphMode(data.graphMode),
    plotFormula: cleanString(data.plotFormula),
    plotDomainMin: typeof data.plotDomainMin === 'number' ? data.plotDomainMin : undefined,
    plotDomainMax: typeof data.plotDomainMax === 'number' ? data.plotDomainMax : undefined,
    plot3DFormula: cleanString(data.plot3DFormula),
    plot3DXMin: typeof data.plot3DXMin === 'number' ? data.plot3DXMin : undefined,
    plot3DXMax: typeof data.plot3DXMax === 'number' ? data.plot3DXMax : undefined,
    plot3DYMin: typeof data.plot3DYMin === 'number' ? data.plot3DYMin : undefined,
    plot3DYMax: typeof data.plot3DYMax === 'number' ? data.plot3DYMax : undefined,
    graphNodes,
    graphLinks,
    graphDirected: typeof data.graphDirected === 'boolean' ? data.graphDirected : undefined,
    matrixRows,
    geometryShape: cleanString(data.geometryShape),
    geometryParams: data.geometryParams,
    vectorFieldFormulaX: cleanString(data.vectorFieldFormulaX),
    vectorFieldFormulaY: cleanString(data.vectorFieldFormulaY),
    unitCircleAngle: typeof data.unitCircleAngle === 'number' ? data.unitCircleAngle : undefined,
    complexReal: typeof data.complexReal === 'number' ? data.complexReal : undefined,
    complexImaginary: typeof data.complexImaginary === 'number' ? data.complexImaginary : undefined,
    vennSets: Array.isArray(data.vennSets) ? data.vennSets : undefined,
    vennIntersections: Array.isArray(data.vennIntersections) ? data.vennIntersections : undefined,
    quiz: data.quiz && typeof data.quiz.question === 'string' ? data.quiz : undefined,
    stepByStep,
    bentoTitle: cleanString(data.bentoTitle),
    bentoSubtitle: cleanString(data.bentoSubtitle),
    bentoItems: Array.isArray(data.bentoItems) ? data.bentoItems : undefined,
    treeTitle: cleanString(data.treeTitle),
    treeSubtitle: cleanString(data.treeSubtitle),
    treeRootId: cleanString(data.treeRootId),
    treeNodes: Array.isArray(data.treeNodes) ? data.treeNodes : undefined,
    particleTitle: cleanString(data.particleTitle),
    particleSubtitle: cleanString(data.particleSubtitle),
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
        temperature: 0.15,
        top_p: 0.95,
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
