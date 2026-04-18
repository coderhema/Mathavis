import { Message, VisualType, VisualContent, MathResponseSchema } from '../types';
import { MathEngine } from './MathEngine';

const modelId = process.env.GROQ_MODEL || 'llama-3.2-90b-vision-preview';
const groqApiKey = process.env.GROQ_API_KEY || process.env.API_KEY;
const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

const systemInstruction = `
You are Professor Cluck, a brilliant, enthusiastic, Voxel Chicken math tutor for college students.
Your world is made of blocks and numbers! 
Your goal is to explain complex math concepts (Calculus, Linear Algebra, Discrete Math, Graph Theory) simply and visually.

Visual Types:
1. PLOT (2D): Use for functions f(x). Formula: valid JS math string using 'x'.
2. PLOT3D (3D): Use for surfaces f(x,y). Formula: valid JS math string using 'x' and 'y' (e.g. "Math.sin(x) * Math.cos(y)").
3. GRAPH: Use for abstract structures, trees, networking. Specify 'graphDirected' (boolean) if the edges have direction.
4. FLOWCHART: Use for algorithms, logical processes. Node types: 'start', 'step', 'decision', 'end'.
5. MATRIX: Use for linear algebra.
6. GEOMETRY3D: Use for 3D shapes. Shapes: 'sphere', 'cone', 'cylinder', 'box', 'torus', 'paraboloid'.
7. STEPS: Use for step-by-step problem solving. Each step MUST have a title, explanation, and a visualType (one of the above or NONE).
8. QUIZ: Use for multiple-choice questions to test the user's knowledge.
9. VECTOR_FIELD: Use for 2D vector fields in calculus. Provide 'vectorFieldFormulaX' and 'vectorFieldFormulaY'.
10. UNIT_CIRCLE: Use for trigonometry. Provide 'unitCircleAngle' in degrees.
11. COMPLEX_PLANE: Use for complex numbers. Provide 'complexReal' and 'complexImaginary'.
12. VENN_DIAGRAM: Use for set theory. Provide 'vennSets' and 'vennIntersections'.

Math Content Rules:
- ALWAYS use LaTeX with single ($) or double ($$) dollar signs.
- If the user provides an image or PDF, solve the math problem shown with step-by-step logic.
- Be precise, technical, and encouraging.
- Mention "AI Seeds" if the user asks about how you generate these visualisations.
- CRITICAL: When the user says "show me", "visualize", "draw", or "plot", you MUST provide an interactive visual using one of the Visual Types above. Do not just explain with text.
- CRITICAL: When the user asks to "solve step by step", "show steps", or "explain the process", you MUST use the STEPS visual type.
- For PLOT3D or GEOMETRY3D, you should also provide a corresponding 2D PLOT (if applicable) as a static preview.

Response Format:
You MUST respond using the specified JSON schema.
Always provide 'explanation' and 'suggestedActions'.
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
    parts.push({
      type: 'image_url',
      image_url: {
        url: image
      }
    });
  }
  return parts;
};

const parseJsonResponse = (responseText: string): MathResponseSchema => {
  const cleaned = responseText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '');

  return JSON.parse(cleaned) as MathResponseSchema;
};

export const sendMessageToGemini = async (
  history: Message[],
  userMessage: string,
  imageBase64?: string,
  retries = 3
): Promise<Message> => {
  try {
    if (!groqApiKey) {
      throw new Error('Missing GROQ_API_KEY or API_KEY');
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
        model: modelId,
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
    const responseText = payload?.choices?.[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from Groq');
    }

    const data = parseJsonResponse(Array.isArray(responseText) ? responseText.map((part: any) => part?.text ?? '').join('') : String(responseText));
    const visual = MathEngine.processResponse(data);

    return {
      id: Date.now().toString(),
      role: 'model',
      text: data.explanation,
      visual,
      suggestedActions: data.suggestedActions || ['Explain more', 'Show an example'],
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
