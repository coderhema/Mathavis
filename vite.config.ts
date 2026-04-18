import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const groqApiKey = env.GROQ_API_KEY || env.GROQAPI_KEY || env.VITE_GROQ_API_KEY || '';
    const groqModel = env.GROQ_MODEL || env.VITE_GROQ_MODEL || '';
    const geminiApiKey = env.GEMINI_API_KEY || env.GEMINIAPI_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GROQ_API_KEY': JSON.stringify(groqApiKey),
        'process.env.GROQAPI_KEY': JSON.stringify(groqApiKey),
        'process.env.GROQ_MODEL': JSON.stringify(groqModel),
        'process.env.VITE_GROQ_API_KEY': JSON.stringify(groqApiKey),
        'process.env.VITE_GROQ_MODEL': JSON.stringify(groqModel),
        'import.meta.env.GROQ_API_KEY': JSON.stringify(groqApiKey),
        'import.meta.env.GROQAPI_KEY': JSON.stringify(groqApiKey),
        'import.meta.env.GROQ_MODEL': JSON.stringify(groqModel),
        'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(groqApiKey),
        'import.meta.env.VITE_GROQ_MODEL': JSON.stringify(groqModel),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.API_KEY': JSON.stringify(geminiApiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
