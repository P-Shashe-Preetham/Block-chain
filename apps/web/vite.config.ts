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
