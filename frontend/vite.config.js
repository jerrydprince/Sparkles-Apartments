import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true, // Split CSS to load only what each page chunk needs
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group key core react modules
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react-core';
            }
            // Group database SDK module
            if (id.includes('@supabase') || id.includes('supabase')) {
              return 'vendor-supabase';
            }
            // Group UI icons library
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            // Group date functions library
            if (id.includes('date-fns')) {
              return 'vendor-date-fns';
            }
            // Group charts library
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            // Group calendar libraries
            if (id.includes('react-big-calendar') || id.includes('moment')) {
              return 'vendor-calendar';
            }
            // Group other vendor dependencies
            return 'vendor-libs';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
