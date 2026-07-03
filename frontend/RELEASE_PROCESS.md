# Release Process (Automated)

This project is configured to keep releases simple and low‑friction.

## What happens automatically
- On every push/PR to `main`, CI runs: lint → typecheck → build (web & extension) → pack zip.
- Pull requests build a beta prerelease (`vX.Y.Z-beta.N`) without committing version files.
- On pushes to `main`, CI prepares a release bump before building:
  - If the current package version already has a stable tag, CI increments PATCH (`X.Y.Z → X.Y.(Z+1)`).
  - If the current package version does not have a stable tag, CI respects it. Use this when a PR intentionally bumps MINOR or MAJOR.
  - CI syncs the extension manifest, appends an English entry to `CHANGELOG.md` if missing, commits with `[skip ci]`, and creates a tag `vX.Y.Z`.
- After the extension build and zip pack succeed, CI pushes the release commit/tag and publishes a GitHub Release with:
  - Title: `vX.Y.Z`
  - Body: the latest `frontend/CHANGELOG.md` entry
  - Asset: `frontend/dist/wikinote-extension-vX.Y.Z.zip`

## How to trigger a release (zero‑code)
1. Push your changes to the `main` branch (merge your PR as usual).
2. The pipeline will:
   - Prepare the release version and changelog entry
   - Build and test the release commit
   - Push the release commit and tag `vX.Y.Z`
   - Publish a GitHub Release with the extension zip
3. Download the zip from the Release page and submit to Chrome Web Store.

## Versioning rules
- The auto job increments PATCH by default.
- For MINOR/MAJOR bumps, update `frontend/package.json`, `frontend/package-lock.json`,
  `frontend/configs/extension/manifest.json`, and `frontend/CHANGELOG.md` in the PR.
  When the PR merges, CI will see that `vX.Y.Z` is not tagged yet and release that exact version.
- Do not create tags locally for normal PRs; CI owns release tags.

## Notes
- CHANGELOG is always generated/updated in English.
- If your commit messages are in Chinese, the auto entry still uses a neutral English line: “General improvements and maintenance.”
- You can edit `frontend/CHANGELOG.md` later if you want to add more detailed English notes.
