import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Permet l'accès depuis le réseau
    proxy: {
      '/api': {
        // En développement local, pointer vers la production Vercel
        // Pour tester les API en local, utilisez 'npx vercel dev' à la place
        target: process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'https://pmu-archives-exporter.vercel.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Ne pas afficher les erreurs de proxy en développement
            // car on utilise la production pour les API
            if (process.env.NODE_ENV !== 'production') {
              console.log('Proxy vers production Vercel');
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});

