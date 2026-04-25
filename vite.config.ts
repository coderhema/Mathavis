import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const googleSheetLink = env.GOOGLE_SHEET_LINK || '';
    const nvidiaApiKey = env.NVIDIA_API_KEY || '';
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
        'process.env.GOOGLE_SHEET_LINK': JSON.stringify(googleSheetLink),

        'process.env.NVIDIA_API_KEY': JSON.stringify(nvidiaApiKey),

        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINIAPI_KEY': JSON.stringify(geminiApiKey),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.GOOGLE_SHEET_LINK': JSON.stringify(googleSheetLink),

        'import.meta.env.NVIDIA_API_KEY': JSON.stringify(nvidiaApiKey),

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
