import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: resolve(__dirname, "../../dist/extension"),
    emptyOutDir: true,
    // Chrome extension pages have their own isolated resource-loading world.
    // Vite's document-level modulepreload hints are treated as a different
    // request context there and produce "cross-world extension resource
    // mismatch" warnings. The module graph is small and the entry module
    // already loads these local chunks, so omit the hints for this target.
    modulePreload: false,
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, "newtab.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "../../src"),
    },
  },
  define: {
    // 定义环境变量，用于区分Web和Extension环境
    __IS_EXTENSION__: JSON.stringify(true),
  },
  publicDir: resolve(__dirname, "../../public"),
  root: resolve(__dirname, "../.."),
});
