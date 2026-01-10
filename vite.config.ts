import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    // Garante que o process.env.API_KEY do ambiente de build chegue ao navegador
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});