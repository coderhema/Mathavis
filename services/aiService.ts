import { Message, VisualType, MathResponseSchema } from '../types';
import { MathEngine } from './MathEngine';
import OpenAI from 'openai';

const modelId = 'z-ai/glm-4.7';

const getApiKey = (): string => {
  // Browser: read from Vite-injected env (VITE_ prefix)
  if (typeof window !== 'undefined') {
    const env = (import.meta as any).env;
    return env?.VITE_NVIDIA_API_KEY || '';
  }
  // Node (build time): read from process.env
  return (process.env as any)?.VITE_NVIDIA_API_KEY || (process.env as any)?.NVIDIA_API_KEY || '';
};

const getEnv = (key: string): string | undefined => {
  if (typeof window !== 'undefined') {
    const env = (import.meta as any).env;
    return env?.[key];
  }
  return (process.env as any)?.[key];
};

const nvidiaMaxTokens = (() => {
  const raw = getEnv('NVIDIA_MAX_TOKENS');
  const parsed = raw ? Number(raw) : 16384;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 16384;
})();

const nvidiaHistoryLimit = (() => {
  const raw = getEnv('NVIDIA_HISTORY_LIMIT');
  const parsed = raw ? Number(raw) : 6;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(Math.floor(parsed), 20) : 6;
})();

const nvidiaMaxRetries = 3;

const cleanString = (val: unknown): string | undefined => {
  if (typeof val === 'string' && val.trim().length > 0) return val.trim();
  return undefined;
};

const inferVisualType = (data: Partial<MathResponseSchema>): VisualType => {
  const type = typeof data.visualType === 'string' ? data.visualType.toUpperCase() : undefined;
  if (type && validVisualTypes.has(type as any)) return type as VisualType;
  if (data.plotFormula || data.plot3DFormula) return VisualType.PLOT;
  if (data.graphNodes?.length) return VisualType.GRAPH;
  if (data.matrixRows?.length) return VisualType.MATRIX;
  if (data.geometryShape) return VisualType.GEOMETRY3D;
  return VisualType.NONE;
};

const normalizeGraphMode = (mode: unknown): 'network' | 'flowchart' | 'tree' | undefined => {
  if (typeof mode === 'string' && validGraphModes.has(mode.toLowerCase())) return mode.toLowerCase() as any;
  return undefined;
};

const normalizeMatrixRows = (rows: unknown): any[] => {
  if (!Array.isArray(rows)) return [];
  return (rows as any[]).filter(r => r && typeof r === 'object' && Array.isArray(r.values)).map(r => ({ values: r.values }));
};

const normalizeNodes = (nodes: unknown): any[] => {
  if (!Array.isArray(nodes)) return [];
  return (nodes as any[])
    .filter(n => n && typeof n === 'object' && typeof n.id === 'string' && typeof n.label === 'string')
    .map(n => ({ id: n.id, label: n.label, x: n.x ?? 0, y: n.y ?? 0, group: n.group ?? '' }));
};

const normalizeLinks = (links: unknown): any[] => {
  if (!Array.isArray(links)) return [];
  return (links as any[])
    .filter(l => l && typeof l === 'object' && typeof l.source === 'string' && typeof l.target === 'string')
    .map(l => ({ source: l.source, target: l.target }));
};

const asStringArray = (val: unknown, fallback: string[]): string[] => {
  if (Array.isArray(val) && val.every(v => typeof v === 'string' && v.trim().length > 0)) return val as string[];
  return fallback;
};

const validVisualTypes = new Set(Object.values(VisualType));
const validGraphModes = new Set(['network', 'flowchart', 'tree']);

const systemInstruction = `You are Professor Cluck, a math tutor AI. You MUST respond with EXACTLY ONE valid JSON object. NO text, NO markdown, NO code fences, NO explanations outside the JSON.

Start your response with { and end with }. Nothing else.

Required fields: "explanation" (string), "visualType" (one of: NONE, PLOT, PLOT3D, GRAPH, FLOWCHART, MATRIX, GEOMETRY3D, STEPS, QUIZ, VECTOR_FIELD, UNIT_CIRCLE, COMPLEX_PLANE, VENN_DIAGRAM, BENTO, TREE, PARTICLE), "suggestedActions" (array of 2 strings).

Only include other fields when relevant to the visualType chosen.`;

const normalizeResponse = (data: Partial<MathResponseSchema>): MathResponseSchema => {
  const visualType = inferVisualType(data);
  const matrixRows = normalizeMatrixRows(data.matrixRows);
  const graphNodes = normalizeNodes(data.graphNodes);
  const graphLinks = normalizeLinks(data.graphLinks);
  const stepByStep = data.stepByStep && Array.isArray(data.stepByStep.steps)
    ? {
        problem: cleanString(data.stepByStep.problem) ?? '',
        steps: (data.stepByStep.steps as any[])
          .filter(step => step && typeof step.title === 'string' && typeof step.explanation === 'string')
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

const parseJsonResponse = (responseText: string): Partial<MathResponseSchema> => {
  const cleaned = responseText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '');

  const start = cleaned.indexOf('{');
  if (start < 0) return {};

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) {
        const jsonStr = cleaned.slice(start, i + 1);
        try {
          return JSON.parse(jsonStr);
        } catch {
          try {
            const repaired = jsonStr
              .replace(/\\n/g, '\\\\n')
              .replace(/\\t/g, '\\\\t')
              .replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(repaired);
          } catch {
            return {};
          }
        }
      }
    }
  }
  return {};
};

export const sendMessageToAI = async (
  history: Message[],
  userMessage: string,
  imageBase64?: string,
  retries = nvidiaMaxRetries,
  modelOverride?: string
): Promise<Message> => {
  const effectiveRetries = Math.max(0, Math.min(retries, nvidiaMaxRetries));
  const modelToUse = modelOverride ?? modelId;

  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('No NVIDIA API key found. Set NVIDIA_API_KEY or VITE_NVIDIA_API_KEY in .env');
      throw new Error('Missing API key');
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      dangerouslyAllowBrowser: true
    });

    const recentHistory = nvidiaHistoryLimit > 0 ? history.slice(-nvidiaHistoryLimit) : [];
    const messages: any[] = [];

    recentHistory.forEach((msg) => {
      const role = msg.role === 'model' ? 'assistant' : 'user';
      if (messages.length === 0 && role === 'assistant') {
        messages.push({ role: 'user', content: 'Continue.' });
      }
      if (messages.length > 0 && messages[messages.length - 1].role === role) {
        messages[messages.length - 1].content += '\n' + msg.text;
        return;
      }
      messages.push({
        role,
        content: msg.image
          ? [{ type: 'text', text: msg.text }, { type: 'image_url', image_url: { url: msg.image } }]
          : msg.text
      });
    });

    const userContent = imageBase64
      ? [{ type: 'text', text: userMessage }, { type: 'image_url', image_url: { url: imageBase64 } }]
      : userMessage;

    if (messages.length === 0 || messages[messages.length - 1].role === 'assistant') {
      const content = messages.length === 0
        ? `${systemInstruction}\n\n${userContent}`
        : userContent;
      messages.push({ role: 'user', content });
    } else {
      messages[messages.length - 1].content += '\n\n' + (typeof userContent === 'string' ? userContent : JSON.stringify(userContent));
    }

    const stream = await openai.chat.completions.create({
      model: modelToUse,
      messages,
      temperature: 0.15,
      top_p: 0.95,
      max_tokens: nvidiaMaxTokens,
      stream: true,
    });

    let responseText = '';
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      responseText += content;
    }

    if (!responseText) {
      throw new Error('No response from NVIDIA');
    }

    console.log('=== RAW NVIDIA RESPONSE (first 500 chars) ===');
    console.log(responseText.substring(0, 500));
    console.log('=== END RAW RESPONSE ===');

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
    console.error('NVIDIA API Error:', error);

    if (effectiveRetries > 0) {
      console.log(`Retrying in 2500ms... (${effectiveRetries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 2500));
      return sendMessageToAI(history, userMessage, imageBase64, effectiveRetries - 1, modelToUse);
    }

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
