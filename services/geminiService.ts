
import { GoogleGenAI, Type } from "@google/genai";
import { Message, VisualType, VisualContent, MathResponseSchema } from '../types';
import { MathEngine } from "./MathEngine";

const modelId = "gemini-3-pro-preview";

const systemInstruction = `
You are Professor Cluck, a brilliant, enthusiastic Voxel Chicken math tutor for college students.
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

export const sendMessageToGemini = async (history: Message[], userMessage: string, imageBase64?: string, retries = 3): Promise<Message> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const getMimeType = (dataUrl: string) => {
      if (dataUrl.startsWith('data:application/pdf')) return 'application/pdf';
      return 'image/jpeg';
    };

    const contents = history.map(msg => ({
      role: msg.role,
      parts: [
        { text: msg.text },
        ...(msg.image ? [{ inlineData: { data: msg.image.split(',')[1], mimeType: getMimeType(msg.image) } }] : [])
      ]
    }));

    const newUserParts: any[] = [{ text: userMessage }];
    if (imageBase64) {
      newUserParts.push({
        inlineData: {
          data: imageBase64.split(',')[1],
          mimeType: getMimeType(imageBase64)
        }
      });
    }

    contents.push({
      role: 'user',
      parts: newUserParts
    });

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            visualType: { type: Type.STRING, enum: ["PLOT", "PLOT3D", "GRAPH", "FLOWCHART", "MATRIX", "GEOMETRY3D", "STEPS", "QUIZ", "VECTOR_FIELD", "UNIT_CIRCLE", "COMPLEX_PLANE", "VENN_DIAGRAM", "NONE"] },
            suggestedActions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            plotFormula: { type: Type.STRING },
            plotDomainMin: { type: Type.NUMBER },
            plotDomainMax: { type: Type.NUMBER },
            plot3DFormula: { type: Type.STRING },
            graphNodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  group: { type: Type.INTEGER },
                  type: { type: Type.STRING } 
                }
              }
            },
            graphLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  label: { type: Type.STRING }
                }
              }
            },
            graphDirected: { type: Type.BOOLEAN },
            matrixRows: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              }
            },
            geometryShape: { type: Type.STRING },
            geometryParams: { type: Type.OBJECT },
            vectorFieldFormulaX: { type: Type.STRING },
            vectorFieldFormulaY: { type: Type.STRING },
            unitCircleAngle: { type: Type.NUMBER },
            complexReal: { type: Type.NUMBER },
            complexImaginary: { type: Type.NUMBER },
            vennSets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  size: { type: Type.NUMBER }
                }
              }
            },
            vennIntersections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sets: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                  size: { type: Type.NUMBER }
                }
              }
            },
            quiz: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      isCorrect: { type: Type.BOOLEAN }
                    },
                    required: ["id", "text", "isCorrect"]
                  }
                },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "explanation"]
            },
            stepByStep: {
              type: Type.OBJECT,
              properties: {
                problem: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      visualType: { type: Type.STRING, enum: ["PLOT", "PLOT3D", "GRAPH", "FLOWCHART", "MATRIX", "GEOMETRY3D", "QUIZ", "VECTOR_FIELD", "UNIT_CIRCLE", "COMPLEX_PLANE", "VENN_DIAGRAM", "NONE"] },
                      plotFormula: { type: Type.STRING },
                      plotDomainMin: { type: Type.NUMBER },
                      plotDomainMax: { type: Type.NUMBER },
                      plot3DFormula: { type: Type.STRING },
                      graphNodes: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            group: { type: Type.INTEGER },
                            type: { type: Type.STRING } 
                          }
                        }
                      },
                      graphLinks: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            source: { type: Type.STRING },
                            target: { type: Type.STRING },
                            label: { type: Type.STRING }
                          }
                        }
                      },
                      graphDirected: { type: Type.BOOLEAN },
                      matrixRows: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.ARRAY,
                          items: { type: Type.NUMBER }
                        }
                      },
                      geometryShape: { type: Type.STRING },
                      geometryParams: { type: Type.OBJECT },
                      vectorFieldFormulaX: { type: Type.STRING },
                      vectorFieldFormulaY: { type: Type.STRING },
                      unitCircleAngle: { type: Type.NUMBER },
                      complexReal: { type: Type.NUMBER },
                      complexImaginary: { type: Type.NUMBER },
                      vennSets: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            size: { type: Type.NUMBER }
                          }
                        }
                      },
                      vennIntersections: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            sets: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                            size: { type: Type.NUMBER }
                          }
                        }
                      },
                      quiz: {
                        type: Type.OBJECT,
                        properties: {
                          question: { type: Type.STRING },
                          options: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                id: { type: Type.STRING },
                                text: { type: Type.STRING },
                                isCorrect: { type: Type.BOOLEAN }
                              },
                              required: ["id", "text", "isCorrect"]
                            }
                          },
                          explanation: { type: Type.STRING }
                        },
                        required: ["question", "options", "explanation"]
                      }
                    },
                    required: ["title", "explanation", "visualType"]
                  }
                }
              },
              required: ["problem", "steps"]
            }
          },
          required: ["explanation", "visualType", "suggestedActions"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("No response from Gemini");

    const data = JSON.parse(responseText) as MathResponseSchema;
    const visual = MathEngine.processResponse(data);

    return {
      id: Date.now().toString(),
      role: 'model',
      text: data.explanation,
      visual: visual,
      suggestedActions: data.suggestedActions || ["Explain more", "Show an example"],
      timestamp: Date.now()
    };

  } catch (error: any) {
    // Handle 429 Rate Limit Error
    const errorString = typeof error === 'string' ? error : JSON.stringify(error);
    const isRateLimit = 
      error?.status === 429 || 
      error?.error?.code === 429 ||
      errorString.includes('429') || 
      errorString.includes('RESOURCE_EXHAUSTED') ||
      errorString.includes('quota');

    if (isRateLimit) {
      if (retries > 0) {
        // Exponential backoff: 3s, 6s, 12s
        const delay = Math.pow(2, 4 - retries) * 1500;
        console.log(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendMessageToGemini(history, userMessage, imageBase64, retries - 1);
      }
      
      return {
        id: Date.now().toString(),
        role: 'model',
        text: "Squawk! I'm out of math energy (quota exceeded). The math universe is a bit crowded right now. Please wait a minute and try again!",
        visual: { type: VisualType.NONE },
        suggestedActions: ["Try again in a minute", "Check my progress"],
        timestamp: Date.now()
      };
    }

    console.error("Gemini API Error:", error);

    return {
      id: Date.now().toString(),
      role: 'model',
      text: "Squawk! I'm having trouble connecting to the math universe. Check your PROJECT or PROJECT_ID if required, or try again later.",
      visual: { type: VisualType.NONE },
      suggestedActions: ["Try again"],
      timestamp: Date.now()
    };
  }
};
