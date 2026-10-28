import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

const backend = {
  target: 'http://localhost:4000',
  changeOrigin: true,
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': backend,
      '/imagenes': backend,
    }
  }
})
