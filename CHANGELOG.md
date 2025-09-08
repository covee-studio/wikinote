# Changelog

All notable changes to this project will be documented in this file.

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
