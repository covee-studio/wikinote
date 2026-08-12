# Release Process

Release versions are committed explicitly so local development, `main`, and
published artifacts always describe the same source tree.

## What happens automatically
- Every pull request and push to `main` runs lint, typecheck, extension build,
  packaging, and regression checks.
- CI uploads the verified ZIP as a workflow artifact but never modifies or
  pushes source files back to `main`.
- Pushing an explicit `vX.Y.Z` tag verifies that the tag, package, manifest,
  and lockfile versions match, then publishes a GitHub Release with:
  - Title: `vX.Y.Z`
  - Body: the latest `frontend/CHANGELOG.md` entry
  - Asset: `frontend/dist/wikinote-extension-vX.Y.Z.zip`

## How to release
1. Update the same version in `frontend/package.json`,
   `frontend/package-lock.json`, and
   `frontend/configs/extension/manifest.json`.
2. Add a concrete English entry to `frontend/CHANGELOG.md`.
3. Commit and push the changes to `main`; wait for the build workflow to pass.
4. Create and push the matching tag, for example `v2.0.8`.
5. Download the ZIP from the GitHub Release and submit it to Chrome Web Store.

## Versioning rules
- Every Chrome Web Store upload must use a version higher than the currently
  published version.
- Version files and the changelog are part of the release commit.
- A release tag is immutable and must point to that exact commit.

## Notes
- Keep changelog entries concrete and in English.
- The ZIP must contain `manifest.json` at its root.
