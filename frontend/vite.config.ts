import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // local dev only — production calls /api on the same Vercel origin, no proxy needed there
      "/api": { target: "http://localhost:3001", changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
});
