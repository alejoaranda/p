import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    open: true
  },
  define: {
    // Ensure process.env is available for the Netlify function context if needed,
    // though client-side code will use import.meta.env
    'process.env': process.env
  },
  build: {
    rollupOptions: {
      // Evitar que el SDK de Gemini cause problemas durante el build
      output: {
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    // Excluir @google/genai de la optimización previa para evitar conexiones durante el build
    exclude: ['@google/genai']
  }
});
