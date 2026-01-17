
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do arquivo .env e do sistema
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
      // Usamos fallback para string vazia para evitar que o builder injete 'undefined' como token
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ""),
      // Fallback para o objeto process não quebrar no browser caso a chave não seja injetada
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY || process.env.API_KEY || "")
      }
    }
  };
});
