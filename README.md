# Wikinote

A new tab that puts one thing in front of you — a single article, quietly chosen at random.

Wikipedia, Hacker News, or your own Memos. A quiet window in the moment between tabs.

Built as a fork of [IsaacGemal/wikitok](https://github.com/IsaacGemal/wikitok), shaped along the way with ideas from [几枝](https://github.com/liminalpurr/jizhi).

Wikipedia and Hacker News use public APIs. Memos connects directly to your own instance — no OAuth or backend proxy required.

## What it does

- One article per new tab, refreshed each time
- Three content sources: Wikipedia, Hacker News, and self-hosted Memos
- 40 Wikipedia languages
- 11 visual themes: Waves, Ripples, Mist, Solar, Stars, Paper, Mountains, Bamboo, Ocean, Rainbow, and Snow
- Time-aware Solar theme that shifts from morning to day, evening, and night
- Likes saved locally, with export
- Share articles or copy links
- Chrome Extension new-tab override and Progressive Web App
- No backend required

## Tech Stack

React 18 + TypeScript · Tailwind CSS v4 · Vite · Chrome Extension MV3 · PWA

## Development

All commands run from the `frontend/` directory.

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Build

```bash
npm run build:web        # web app
npm run build:extension  # Chrome extension
npm run build:all        # both
```

Output directories (relative to `frontend/`):

- Web: `dist/web/`
- Extension: `dist/extension/`

## Install extension (dev)

1. Run `npm run build:extension` in `frontend/`
2. Open `chrome://extensions/` and enable Developer Mode
3. Click "Load unpacked" and select `frontend/dist/extension/`

## Deploy (Vercel / Netlify)

- Root directory: `frontend`
- Build command: `npm run build` (delegates to `build:web`)
- Output directory: `dist/web`

## Sources

| Source | Auth | Notes |
|--------|------|-------|
| Wikipedia | None | Random articles across 40 languages |
| Hacker News | None | Top stories via the public HN Firebase API |
| Memos | API token (your own instance) | Self-hosted [Memos](https://github.com/usememos/memos) personal notes |

Memos requires a self-hosted instance URL and API token, configured in the Sources panel inside the app. Wikipedia and Hacker News work immediately with no setup.

New sources should use a fully public API — no OAuth, no backend proxy. This keeps the app deployable without a server.

## Support

If you enjoy Wikinote, consider buying me a coffee:

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/exploreryer)

## License

MIT — see [LICENSE](LICENSE).

## Star History

![Star History Chart](https://api.star-history.com/svg?repos=Exploreryer/wikinote&type=Date)
