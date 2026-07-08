---
name: Icon legibility at small sizes
description: Why a visually striking source image can fail as a favicon/toolbar icon, and how to verify before adopting one.
---

Photorealistic or softly-gradiented illustrations (glows, thin overlapping silhouettes, subtle color transitions) lose almost all detail when scaled down to browser-extension toolbar size (~16-19px effective) or favicon size. They render as an indistinct color blob rather than a recognizable mark.

**Why:** Small icons only have a handful of pixels to represent shape. Detail that depends on gradients or soft edges disappears; only bold, high-contrast, geometrically simple shapes (flat color regions, a clear silhouette) survive.

**How to apply:** Before adopting any new candidate logo/icon image, actually render it down with sharp (or similar) to 16x16 and 32x32, then view the result (upscale with nearest-neighbor for inspection) rather than judging legibility from the full-size image alone. If it turns to mush, ask for a simplified/flattened version (fewer gradient stops, bolder silhouette, higher contrast) rather than forcing the original art into all sizes. It's fine to iterate with the user on a simplified version specifically for this purpose.
