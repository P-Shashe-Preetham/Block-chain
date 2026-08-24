import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../../shared"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    allowedHosts: [".manus.computer"],
    proxy: {
      "/v1": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/healthz": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: "node",
    exclude: ["tests/**", "node_modules/**"],
  },
});
