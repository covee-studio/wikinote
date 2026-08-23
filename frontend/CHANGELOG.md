# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.1.0](https://github.com/covee-studio/wikinote/compare/v2.0.8...v2.1.0) (2026-08-23)


### Features

* add local recent collection ([6a9827d](https://github.com/covee-studio/wikinote/commit/6a9827de294dbff0257329246ce4ff22f5ea9e04))
* add local recent collection ([12e9391](https://github.com/covee-studio/wikinote/commit/12e9391771a143adc75d3ad661bea0a732cdb3e2))
* add web extension install entry ([cb6fe3c](https://github.com/covee-studio/wikinote/commit/cb6fe3c7d66e83bcd32fbe9efacae29b931f03f6))

# Changelog

All notable changes to this project will be documented in this file.

## v2.0.8 - 2026-08-12

- Fixed: Removed translation engine attribution from the reading interface for a cleaner experience.
- Fixed: Prevented Chrome's white canvas from flashing before the new-tab interface is ready.
- Fixed: Packaged Chrome Web Store builds with `manifest.json` at the ZIP root.
- Fixed: Kept package, manifest, and lockfile versions synchronized.
- Changed: Release automation now builds immutable tagged versions without committing generated version bumps back to `main`.

## v2.0.7 - 2026-08-02

- Changed: Refined the extension name for clearer discovery in Chrome.


## v2.0.6 - 2026-08-02

- Changed: Updated the extension name and summary to cover all supported reading sources.

## v2.0.5 - 2026-08-01

- Added: Hypothesis annotations as a configurable reading source.
- Added: Optional Chrome Sync for compact favorite previews without syncing source credentials.
- Changed: Unified source toggles and refreshed source/settings interactions.
- Changed: Updated Chrome Web Store disclosures and added a dedicated privacy policy.
- Fixed: Various reading layout, overflow, loading, and visual consistency issues.

## v2.0.4 - 2026-07-09

- Fixed: 1 issue(s)


## v2.0.3 - 2026-07-08

- Fixed: 1 issue(s)
- Changed: 1 update(s)


## v2.0.2 - 2026-07-03

- Chore: 1 task(s)


## v2.0.1 - 2026-07-03

- Fixed: Long Memos entries now scroll inside Zen mode instead of overflowing the viewport.
- Fixed: Memos batches now cycle through non-overlapping windows and refresh the displayed Zen item after each new batch.
- Release: Web app and Chrome extension versions are synchronized at 2.0.1.

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
