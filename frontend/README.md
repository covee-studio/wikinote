# Wikinote - Dual Build (Web + Extension)

Build Web and Chrome Extension from a single codebase.

## 🚀 Quick Start

### Dev
```bash
npm run dev
```

### Build
```bash
npm run build:all
# or
npm run build:web
npm run build:extension
```

## 📁 Structure

```
frontend/
├── src/                    # Shared React code
├── configs/                # Build configs
│   ├── web/                # Web config
│   └── extension/          # Extension config
├── scripts/                # Build scripts
└── dist/                   # Outputs (web/ and extension/)
```

## 🔄 Environment Layer

Handled in `src/utils/environment.ts`:
- Storage adapter (localStorage vs Chrome Storage)
- `fetchWithCORS` uses Wikipedia API with `origin=*` (no forced Origin header)
- Analytics only enabled on Web

## 🔒 CSP

`configs/extension/manifest.json` contains a strict `extension_pages` CSP aligned with Wikipedia domains and data URLs for images.

## 🖼️ Icons

Build script ensures required icons; missing sizes (16/32/48/128) are auto-generated from `web-app-manifest-512x512.png`.

## 🧪 Testing

Load `dist/extension/` in `chrome://extensions/`. See `TESTING_GUIDE.md` for details.

## ✅ Conventions

- Keep code and documentation in English
- Lint: `npm run lint` (with `jsx-a11y`)
- Strong TypeScript settings enabled

## 📦 Deployment Notes (IMPORTANT)

- Deploy the Web app directly from the `frontend` project (no extra wrapper build step). This project is already a standard Vite web app. On platforms like Vercel/Netlify, set:
  - Project root: `frontend`
  - Build command: `npm run build:web` (or simply `npm run build` which delegates to `build:web`)
  - Output directory: `dist/web` (relative to repository root: `./dist/web`)
- Do NOT try to deploy by serving files from `frontend/../../dist/web` produced elsewhere; the hosting provider should run the build from the `frontend` project directly to ensure environment consistency, correct paths, and PWA registration.

### Chrome Extension
- Build with `npm run build:extension`
- Load unpacked extension from `frontend/dist/extension/` in `chrome://extensions/`
- The extension manifest is MV3 (`manifest_version: 3`). If Chrome reports a manifest error, double‑check you selected `frontend/dist/extension/` (not `dist/extension/` at repository root).
