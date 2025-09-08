import { defineConfig } from "wxt";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC_DIR = resolve(__dirname, "src");

export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	manifestVersion: 3,
	manifest: {
		name: "Wikinote",
		version: "1.0.2",
		description: "Discover random Wikipedia articles on every new tab",
		permissions: ["storage", "unlimitedStorage"],
		host_permissions: ["https://*.wikipedia.org/*"],
		chrome_url_overrides: {
			newtab: "newtab.html",
		},
		icons: {
			"16": "icons/icon-16.png",
			"32": "icons/icon-32.png",
			"48": "icons/icon-48.png",
			"128": "icons/icon-128.png",
		},
		action: {
			default_title: "Wikinote",
			default_icon: {
				"16": "icons/icon-16.png",
				"32": "icons/icon-32.png",
				"48": "icons/icon-48.png",
				"128": "icons/icon-128.png",
			},
		},
		content_security_policy: {
			extension_pages:
				"script-src 'self' 'wasm-unsafe-eval'; object-src 'self'; connect-src 'self' https://*.wikipedia.org https://en.wikipedia.org https://upload.wikimedia.org; img-src 'self' data: https://*; style-src 'self' 'unsafe-inline' data:;",
		},
	},
	vite: () => ({
		plugins: [react(), tailwindcss()],
		define: {
			__IS_EXTENSION__: JSON.stringify(true),
		},
		resolve: {
			alias: {
				"@": SRC_DIR,
			},
		},
	}),
});

