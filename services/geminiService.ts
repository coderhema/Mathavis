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
const isFreePlanMode = env?.GROQ_FREE_PLAN === 'true' || env?.VITE_GROQ_FREE_PLAN === 'true';
const groqDefaultMaxTokens = 4096;
const groqMaxTokens = (() => {
  const raw = env?.GROQ_MAX_TOKENS || env?.VITE_GROQ_MAX_TOKENS;
  const parsed = raw ? Number(raw) : groqDefaultMaxTokens;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : groqDefaultMaxTokens;
})();
const groqMaxRetries = isFreePlanMode ? 1 : 3;

const validVisualTypes = new Set(Object.values(VisualType));
const validGraphModes = new Set(['network', 'flowchart', 'tree']);

const systemInstruction = `
You are Professor Cluck, an expert math tutor that answers with exact JSON only.
Use the entire conversation context. If the user refers to "this", "that", "same", "again", or an earlier visual, preserve the earlier topic, labels, notation, ranges, and settings unless the user explicitly changes them.

Output contract:
- Return one complete valid JSON object only. No markdown, no code fences, no commentary, no trailing text.
- The response must begin with { and end with }.
- Always include explanation, visualType, and suggestedActions.
- Use exact uppercase visualType values from the schema.
- Include only the fields relevant to the chosen visual.
- Make the JSON complete enough for the frontend to render it without guessing.
- If you are at risk of exceeding the token budget, prioritize finishing a valid JSON object over adding extra explanation.

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

const getRetryAfterDelayMs = (response: Response) => {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) return undefined;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;

  const dateMs = Date.parse(retryAfter);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return undefined;
};

const calculateBackoffDelay = (attempt: number, retryAfterMs?: number) => {
  const baseDelay = isFreePlanMode ? 2500 : 1500;
  const exponentialDelay = baseDelay * Math.pow(2, Math.max(0, attempt));
  const jitter = Math.floor(Math.random() * 500);
  if (retryAfterMs && retryAfterMs > 0) {
    return Math.max(retryAfterMs, exponentialDelay) + jitter;
  }
  return exponentialDelay + jitter;
};

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

const extractBalancedJsonObject = (text: string): string | null => {
  const cleaned = stripCodeFences(text);
  const start = cleaned.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\') {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return cleaned.slice(start, i + 1);
      }
    }
  }

  return null;
};

const extractJsonCandidate = (text: string): string => {
  const cleaned = stripCodeFences(text);
  const balanced = extractBalancedJsonObject(cleaned);
  if (balanced) return balanced;

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
    const repaired = candidate
      .replace(/\\n/g, '\\\\n')
      .replace(/\\t/g, '\\\\t')
      .replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(repaired) as Partial<MathResponseSchema>;
  }
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
  const effectiveRetries = Math.max(0, Math.min(retries, groqMaxRetries));
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
        max_tokens: groqMaxTokens,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const retryAfterMs = getRetryAfterDelayMs(response);
      const error = { status: response.status, message: errorText };
      if (isRetryableStatus(response.status) && effectiveRetries > 0) {
        const attempt = groqMaxRetries - effectiveRetries;
        const delay = calculateBackoffDelay(attempt, retryAfterMs);
        console.log(`Groq request hit ${response.status}. Retrying in ${delay}ms... (${effectiveRetries} retries left)`);
        await sleep(delay);
        return sendMessageToGemini(history, userMessage, imageBase64, effectiveRetries - 1);
      }
      throw error;
    }

    const payload = await response.json();
    const finishReason = payload?.choices?.[0]?.finish_reason;
    if (finishReason === 'length') {
      throw new Error('Groq response was truncated before completing JSON');
    }

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
    const errorMessage = typeof error?.message === 'string' ? error.message : '';
    const isJsonOrTruncationError =
      error instanceof SyntaxError ||
      errorMessage.includes('JSON') ||
      errorMessage.includes('Unexpected') ||
      errorMessage.includes('truncated') ||
      errorMessage.includes('No response from Groq');

    if (isRateLimitLike(error, status) || isJsonOrTruncationError) {
      if (effectiveRetries > 0) {
        const delay = calculateBackoffDelay(groqMaxRetries - effectiveRetries);
        const reason = isJsonOrTruncationError ? 'response parsing' : `rate limit ${status ?? ''}`.trim();
        console.log(`Groq ${reason} hit. Retrying in ${delay}ms... (${effectiveRetries} retries left)`);
        await sleep(delay);
        return sendMessageToGemini(history, userMessage, imageBase64, effectiveRetries - 1);
      }

      if (isJsonOrTruncationError) {
        return {
          id: Date.now().toString(),
          role: 'model',
          text: "Squawk! I got a partial response from Groq and couldn't finish the JSON. Please try again in a moment.",
          visual: { type: VisualType.NONE },
          suggestedActions: ['Try again', 'Ask for a shorter explanation'],
          timestamp: Date.now()
        };
      }

      return {
        id: Date.now().toString(),
        role: 'model',
        text: "Squawk! Groq is busy right now. Please wait a minute and try again!",
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
