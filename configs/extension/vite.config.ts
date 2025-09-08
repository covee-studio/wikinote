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
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, "newtab.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        manualChunks: {
          vendor: ['react', 'react-dom'],
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