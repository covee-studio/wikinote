import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
// Avoid Node path usage to keep TS build simple

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
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
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  define: {
    __IS_EXTENSION__: JSON.stringify(false),
  },
});
