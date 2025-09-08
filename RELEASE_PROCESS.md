# Release Process (Automated)

This project is configured to keep releases simple and low‑friction.

## What happens automatically
- On every push/PR to `main`, CI runs: lint → typecheck → build (web & extension) → pack zip.
- On pushes to `main`, an auto‑bump job increments the PATCH version, syncs the extension manifest, appends an English entry to `CHANGELOG.md`, commits with `[skip ci]`, and creates a tag `vX.Y.Z`.
- Note: auto‑bump runs only on direct pushes to `main` (after the build job). Pull requests do not perform auto‑bump.
- On tag pushes (e.g., `v1.2.3`), CI creates a GitHub Release with:
  - Title: `Release vX.Y.Z`
  - Body: `frontend/CHANGELOG.md`
  - Asset: `frontend/dist/wikinote-extension.zip`

## How to trigger a release (zero‑code)
1. Push your changes to the `main` branch (merge your PR as usual).
2. The pipeline will:
   - Build and test your changes
   - Auto‑bump PATCH version and generate an English changelog entry
   - Tag the commit `vX.Y.Z` and publish a GitHub Release with the extension zip
3. Download the zip from the Release page and submit to Chrome Web Store.

## Versioning rules
- The auto job increments PATCH by default (X.Y.Z → X.Y.(Z+1)).
- For MINOR/MAJOR bumps, run locally in `frontend/` (optional):
  - `npm run release:minor` → creates a minor release and syncs manifest
  - `npm run release:major` → creates a major release and syncs manifest
  - Commit and push tags to trigger the Release on CI

## Notes
- CHANGELOG is always generated/updated in English.
- If your commit messages are in Chinese, the auto entry still uses a neutral English line: “General improvements and maintenance.”
- You can edit `frontend/CHANGELOG.md` later if you want to add more detailed English notes.
