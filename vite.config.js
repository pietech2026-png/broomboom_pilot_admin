import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    // Explicitly include core dependencies to speed up discovery and resolve 'externalize-deps' warnings
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'web-vitals'
    ],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    outDir: 'build',
  },
});

