import { defineConfig } from "vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@projects": path.resolve(__dirname, "./projects"),
      "@app": path.resolve(__dirname, "./src/Application"),
      "@assets": path.resolve(__dirname, "./src/Engine/Assets"),
      "@errors": path.resolve(__dirname, "./src/Application/Errors"),
      "@error": path.resolve(__dirname, "./src/Application/Errors"),
      "@core": path.resolve(__dirname, "./src/Engine/Core"),
      "@lib": path.resolve(__dirname, "./src/Engine/Lib"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
