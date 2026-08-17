import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = process.env.PORT || '8088';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
