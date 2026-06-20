# Changelog

All notable changes to this project will be documented in this file.

## v2.0.0 - 2026-06-15

- Added: Zen mode is now the primary new-tab experience, with animated visual themes and an automatic theme option.
- Added: Source-specific Zen rendering for Wikipedia, Hacker News, and Memos.
- Changed: Refined About, Sources, and Likes modals with animated transitions and a more consistent visual system.
- Fixed: Initial language restoration now reads the saved language before the first render to avoid loading the wrong Wikipedia cache.
- Fixed: Theme picker keyboard and click behavior before the 2.0 release.
- Release: Web app and Chrome extension versions are synchronized at 2.0.0.

## v1.0.2 - 2025-08-12

- Fixed: Prevent initial fetch in English when a non-English user language was previously selected. Now the first request waits for language `ready` and directly uses the saved user language (`frontend/src/App.tsx`). This avoids extra requests and reduces throttling from the Wikipedia API.
- Changed: Improved first-screen loading experience by eliminating unnecessary network requests.

## v1.0.1 - 2025-08-08

- Added: 40 change(s)
- Fixed: 5 issue(s)
- Docs: 1 update(s)
- Changed: 46 update(s)
- Chore: 2 task(s)

## v0.0.2 - 2025-08-09

- Added: 1 change(s)
- Changed: 2 update(s)
