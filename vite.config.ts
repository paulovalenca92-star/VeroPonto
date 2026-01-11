
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do sistema (Netlify) ou do arquivo .env
  // Fix: Cast process to any to access cwd() when types are missing or mismatched in the config environment
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild'
    },
    define: {
      // Prioriza a variável definida no ambiente do sistema (Netlify Dashboard)
      // Fix: Cast process to any to access env when types are missing in the config environment
      'process.env.API_KEY': JSON.stringify(env.API_KEY || (process as any).env.API_KEY)
    }
  };
});
