# Wikinote Project Structure

This document describes the repository layout, build targets, and key conventions used in the project.

## Top-level layout

```
wikinote/
├── LICENSE
├── README.md                 # Root project readme
├── PRIVACY.md                # Public privacy policy for the Chrome extension
├── PROJECT_STRUCTURE.md      # This document
└── frontend/                 # React + TypeScript app (Web + Chrome Extension)
```

## Frontend structure

```
frontend/
├── package.json              # Scripts and dependencies
├── package-lock.json         # Locked dependency graph (npm)
├── tsconfig.json             # TS project references
├── tsconfig.app.json         # TS config for app code
├── tsconfig.node.json        # TS config for Vite/node config
├── vite.config.ts            # Dev config (Web), alias '@' → /src, PWA
├── eslint.config.js          # ESLint config (incl. jsx-a11y)
├── index.html                # Dev HTML entry (Web)
│
├── public/                   # Static assets used in dev & shared
│   ├── favicon.svg
│   ├── favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-192x192.png
│   ├── web-app-manifest-512x512.png
│   └── manifest.json
│
├── configs/                  # Production build configs (separate roots)
│   ├── web/
│   │   ├── vite.config.ts    # Web build config (outDir: ../../dist/web)
│   │   └── index.html        # Web production HTML entry
│   └── extension/
│       ├── vite.config.ts    # Extension build config (outDir: ../../dist/extension)
│       ├── manifest.json     # MV3 manifest (new tab override)
│       └── newtab.html       # New tab page HTML
│
├── scripts/                  # Build and tooling scripts
│   ├── build-web.js          # Build Web target
│   ├── build-extension.js    # Build Extension target + icon ensure/generation
│   ├── build-all.js          # Build both targets in sequence
│   ├── pack-extension.js     # Zip dist/extension → dist/wikinote-extension.zip
│   ├── install-extension.js  # Helper to open chrome://extensions/
│   ├── generate-logos-sharp.js # Optional icon generation helpers
│   └── generate-svg.js       # Optional SVG favicon helper
│
├── src/                      # Shared application code (Web & Extension)
│   ├── main.tsx              # App bootstrap
│   ├── App.tsx               # Root component
│   ├── index.css             # Global styles (Tailwind v4)
│   ├── components/           # UI components (WikiCard, Modals, Skeletons…)
│   ├── hooks/                # Custom hooks (useWikiArticles, useFocusTrap…)
│   ├── contexts/             # Context providers (LikedArticles, Toast)
│   ├── utils/                # Utilities (environment, performance)
│   ├── types/                # Shared TypeScript types
│   ├── styles/               # Component CSS modules
│   ├── locales/              # UI strings (en.json)
│   ├── assets/               # Static assets (e.g., animations)
│   └── languages.ts          # Supported Wikipedia language list
│
└── dist/                     # Build outputs (generated)
    ├── web/                  # Web production build
    └── extension/            # Extension production build
```

## Design principles

- Single codebase, dual builds (Web + Extension) via separate Vite configs.
- Environment adaptation in `src/utils/environment.ts`:
  - Storage adapter (localStorage vs Chrome Storage)
  - `fetchWithCORS` with Wikipedia API (`origin=*`), no forced Origin header
  - Analytics only on Web
- Strong TypeScript settings (strict), ESLint with `jsx-a11y`.
- PWA (Web) via `vite-plugin-pwa`.
- Chrome Web Store submission and privacy details are maintained in `frontend/CHROME_STORE_SUBMISSION.md` and `PRIVACY.md`.
- Accessibility: ErrorBoundary, keyboard navigation, focus trap for modals, toast notifications.

## Build commands

- `npm run dev` — Start Web dev server (uses root `vite.config.ts` and `/public`).
- `npm run build:web` — Build Web production to `dist/web`.
- `npm run build:extension` — Build Extension to `dist/extension`.
- `npm run build:all` — Build both targets.
- `npm run pack:extension` — Zip `dist/extension` to `dist/wikinote-extension.zip` for store submission.

## Chrome Extension specifics

- Manifest V3 with new tab override: `configs/extension/manifest.json`.
- CSP is defined under `content_security_policy.extension_pages` with limited `connect-src` (Wikipedia), `img-src` (https/data), and minimal `style-src`.
- Icons: the build script copies from `/public` and auto‑generates missing sizes (16/32/48/128) into `dist/extension/icons/`.

## Assessment of current structure

Overall, the structure is clear and maintainable:
- Shared React code under `src/` with clean separation of components/hooks/contexts/utils.
- Production builds isolated under `configs/` per target, keeping dev config simple.
- Scripts encapsulate build, packaging, and assets generation.

Optional improvements (nice to have):
- Unify `public/` usage: the Web production config currently has its own root under `configs/web/`. Consider setting `publicDir: ../../public` in `configs/web/vite.config.ts` to use a single source of truth for static assets across dev and prod.
- Prefer a single package manager (project uses npm; remove `bun.lock` to avoid confusion).
- Consider adding CI (GitHub Actions) to run lint/typecheck/build for both targets and upload the zip as an artifact.
- If UI language must remain English‑only, ensure `languages.ts` display names are consistently English (currently many use native names by design).
