import { GoogleGenAI, Modality } from "@google/genai";

class TTSService {
  private ai: GoogleGenAI;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private async getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  async speak(text: string, retries = 2) {
    try {
      this.stop();
      
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this clearly as Professor Cluckity: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' }, // 'Charon' for a neat, authoritative man voice
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioData = this.base64ToArrayBuffer(base64Audio);
        const ctx = await this.getAudioContext();
        const audioBuffer = await ctx.decodeAudioData(audioData);
        
        this.currentSource = ctx.createBufferSource();
        this.currentSource.buffer = audioBuffer;
        this.currentSource.connect(ctx.destination);
        this.currentSource.start();
      }
    } catch (error: any) {
      console.error("TTS Error:", error);
      
      // Handle Rate Limit for TTS
      const isRateLimit = 
        error?.status === 429 || 
        error?.message?.includes('429') || 
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit && retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000;
        console.log(`TTS Rate limit hit. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.speak(text, retries - 1);
      }

      // Fallback to browser TTS if Gemini fails or quota exceeded
      this.fallbackSpeak(text);
    }
  }

  private fallbackSpeak(text: string) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    window.speechSynthesis.cancel();
  }

  private base64ToArrayBuffer(base64: string) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const ttsService = new TTSService();
