
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild'
  },
  define: {
    // Injeção da chave de API no objeto process.env global do navegador
    'process.env.API_KEY': JSON.stringify('AIzaSyD8fnNyRH7t5BKw6g4d7UxoMVho2HM66gY')
  }
});
