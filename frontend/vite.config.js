import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '/',  // Asegura que las rutas sean relativas
  build: {
    outDir: 'dist',  // Directorio donde Vercel busca los archivos
  },
  server: {
    port: 3000,
  }
});
