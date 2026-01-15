

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env e do sistema
  // @fix: Casting process to any to access the cwd() method which might not be defined on the global Process type in some environments
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    },
    define: {
      // Mapeia a API_KEY para que o código frontend consiga acessá-la via process.env.API_KEY
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    }
  };
});