
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega todas as variáveis de ambiente (locais e do sistema como Netlify)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    },
    define: {
      // Mapeia tanto API_KEY quanto VITE_GEMINI_API_KEY para process.env.API_KEY
      // Priorizando a variável específica solicitada para o ambiente Netlify
      'process.env.API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY || 
        env.API_KEY || 
        (process as any).env.VITE_GEMINI_API_KEY || 
        (process as any).env.API_KEY
      )
    }
  };
});
