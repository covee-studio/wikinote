# Wikinote

A new tab that puts something there — one article, quietly chosen at random. Wikipedia, Hacker News, or your own notes.

Built as a fork of [IsaacGemal/wikitok](https://github.com/IsaacGemal/wikitok), shaped along the way with ideas from [几枝](https://github.com/liminalpurr/jizhi).

All built-in sources use fully public APIs — no OAuth, no backend proxy, no token required to get started.

## Features

- Scrollable card feed mixing content from multiple sources
- Three sources out of the box: Wikipedia, Hacker News, and self-hosted Memos
- 14 languages for Wikipedia articles
- Zen mode for distraction-free reading with animated themes
- Liked articles saved locally, with export
- Share articles or copy links
- Chrome Extension (new-tab override) and Progressive Web App (PWA)
- Responsive design for mobile and desktop

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS v4
- Vite
- No backend required

## Development

All commands run from the `frontend/` directory.

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Building

```bash
# Web app only
npm run build:web

# Chrome Extension only
npm run build:extension

# Both at once
npm run build:all
```

Output directories (relative to `frontend/`):
- Web: `dist/web/`
- Extension: `dist/extension/`

## Chrome Extension

1. Run `npm run build:extension` in `frontend/`
2. Open `chrome://extensions/` and enable Developer Mode
3. Click "Load unpacked" and select `frontend/dist/extension/`

## Deploying the Web App

On Vercel / Netlify:
- Root directory: `frontend`
- Build command: `npm run build` (delegates to `build:web`)
- Output directory: `dist/web`

## Sources

| Source | Auth | Notes |
|--------|------|-------|
| Wikipedia | None | Random articles across 14 languages |
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
