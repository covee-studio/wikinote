import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

export default defineConfig({
  // The shared runtime needs an explicit web value. The extension build
  // injects `true` from its own config; without this counterpart the web
  // bundle leaves the identifier unresolved and fails before React mounts.
  define: {
    __IS_EXTENSION__: JSON.stringify(false),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "Wikinote",
        short_name: "Wikinote",
        icons: [
          {
              src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
          },
        ],
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
      },
    }),
  ],
  build: {
    outDir: resolve(__dirname, "../../dist/web"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
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
  // Use the same static assets source as dev/extension
  publicDir: resolve(__dirname, "../../public"),
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
});
