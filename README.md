# Wikinote

A RedNote-style masonry feed for discovering content from multiple open sources. Inspired by [IsaacGemal/wikitok](https://github.com/IsaacGemal/wikitok), enhanced with a waterfall layout suited for web browsing.

All built-in sources use fully public APIs — no OAuth, no backend proxy, no token required to get started.

## Features

- Masonry waterfall layout for comfortable web browsing
- Three content sources out of the box: Wikipedia, Hacker News, and self-hosted Memos
- 14 languages for Wikipedia (English, Spanish, French, German, Chinese, Japanese, and more)
- Article and story cards with images, titles, and excerpts
- Share articles or copy links
- Liked articles saved locally
- Zen mode for distraction-free reading
- Responsive design for mobile and desktop
- Chrome Extension (new-tab override) and Progressive Web App (PWA)

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

New sources must use a fully public API — no OAuth, no backend proxy. This keeps the app deployable without a server.

## Roadmap

This project intentionally does not include export, tagging, sync, user accounts, or closed-platform integrations (e.g. Product Hunt) in the current roadmap.

## Support

If you enjoy Wikinote, consider buying me a coffee:

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/exploreryer)

## License

MIT — see [LICENSE](LICENSE).

## Star History

![Star History Chart](https://api.star-history.com/svg?repos=Exploreryer/wikinote&type=Date)
