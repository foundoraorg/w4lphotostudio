import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The studio API lives in /server and is proxied in development.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8787", changeOrigin: true },
    },
  },
  preview: { host: "0.0.0.0", port: 4173 },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
          return undefined;
        },
      },
    },
  },
});
