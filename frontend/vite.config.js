import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: true,
    port: 5173,
    https: true,
    strictPort: true,
    proxy: {
      // Semua request /api akan diteruskan ke backend (HTTP)
      "/api": {
        target: "http://192.168.200.155:5000",
        changeOrigin: true,
      },
    },
  },
});