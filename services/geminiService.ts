import { Message, VisualType, MathResponseSchema } from '../types';
import { MathEngine } from './MathEngine';

const env = (import.meta as any).env as Record<string, string | undefined> | undefined;
const modelId = 'meta/llama-3.1-8b-instruct';
const nvidiaApiKey = import.meta.env.NVIDIA_API_KEY as string | undefined;
const nvidiaApiUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
const nvidiaDefaultMaxTokens = 2048;
const nvidiaMaxTokens = (() => {
  const raw = env?.NVIDIA_MAX_TOKENS;
  const parsed = raw ? Number(raw) : nvidiaDefaultMaxTokens;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : nvidiaDefaultMaxTokens;
})();
const nvidiaHistoryLimit = (() => {
  const raw = env?.NVIDIA_HISTORY_LIMIT;
  const parsed = raw ? Number(raw) : 6;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(Math.floor(parsed), 20) : 6;
})();
const nvidiaMaxRetries = 3;

const validVisualTypes = new Set(Object.values(VisualType));
const validGraphModes = new Set(['network', 'flowchart', 'tree']);

const systemInstruction = `
You are Professor Cluck.
Return one valid JSON object only.
Be as concise as possible.
Use only the fields needed for the chosen visual.
Keep explanation short and suggestedActions brief.
First keys must be visualType and idea.
No markdown, no code fences, no extra text.
If space is tight, prefer a complete valid JSON object over extra detail.
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
  retries = 3,
  modelOverride?: string
): Promise<Message> => {
  const effectiveRetries = Math.max(0, Math.min(retries, nvidiaMaxRetries));
  const modelToUse = modelOverride ?? modelId;
  try {
    if (!nvidiaApiKey) {
      throw new Error('Missing NVIDIA_API_KEY');
    }

    const recentHistory = nvidiaHistoryLimit > 0 ? history.slice(-nvidiaHistoryLimit) : [];
    const messages = [
      { role: 'system', content: systemInstruction },
      ...recentHistory.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.image ? buildContentParts(msg.text, msg.image) : msg.text
      })),
      {
        role: 'user',
        content: imageBase64 ? buildContentParts(userMessage, imageBase64) : userMessage
      }
    ];

    const response = await fetch(nvidiaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nvidiaApiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature: 0.15,
        top_p: 0.95,
        max_tokens: nvidiaMaxTokens,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const retryAfterMs = getRetryAfterDelayMs(response);
      const error = { status: response.status, message: errorText };

      if (isRetryableStatus(response.status) && effectiveRetries > 0) {
        const attempt = nvidiaMaxRetries - effectiveRetries;
        const delay = calculateBackoffDelay(attempt, retryAfterMs);
        console.log(`NVIDIA request hit ${response.status} on ${modelToUse}. Retrying in ${delay}ms... (${effectiveRetries} retries left)`);
        await sleep(delay);
        return sendMessageToGemini(history, userMessage, imageBase64, effectiveRetries - 1, modelToUse);
      }
      throw error;
    }

    const payload = await response.json();
    const finishReason = payload?.choices?.[0]?.finish_reason;
    if (finishReason === 'length') {
      throw new Error('NVIDIA response was truncated before completing JSON');
    }

    const responseText = extractContentText(payload?.choices?.[0]?.message?.content);
    if (!responseText) {
      throw new Error('No response from NVIDIA');
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
      errorMessage.includes('No response from NVIDIA');

    if (isRateLimitLike(error, status) || isJsonOrTruncationError) {
      if (effectiveRetries > 0) {
        const delay = calculateBackoffDelay(nvidiaMaxRetries - effectiveRetries);
        const reason = isJsonOrTruncationError ? 'response parsing' : `rate limit ${status ?? ''}`.trim();
        console.log(`NVIDIA ${reason} hit on ${modelToUse}. Retrying in ${delay}ms... (${effectiveRetries} retries left)`);
        await sleep(delay);
        return sendMessageToGemini(history, userMessage, imageBase64, effectiveRetries - 1, modelToUse);
      }

      if (isJsonOrTruncationError) {
        return {
          id: Date.now().toString(),
          role: 'model',
          text: "Squawk! I got a partial response from NVIDIA and couldn't finish the JSON. Please try again in a moment.",
          visual: { type: VisualType.NONE },
          suggestedActions: ['Try again', 'Ask for a shorter explanation'],
          timestamp: Date.now()
        };
      }

      return {
        id: Date.now().toString(),
        role: 'model',
        text: "Squawk! NVIDIA is busy right now. Please wait a minute and try again!",
        visual: { type: VisualType.NONE },
        suggestedActions: ['Try again in a minute', 'Check my progress'],
        timestamp: Date.now()
      };
    }

    console.error('NVIDIA API Error:', error);

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
