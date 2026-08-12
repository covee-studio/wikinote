# Design QA

## Source visual truth

- Sources reference: `/var/folders/rj/8bh9nn6j2735plmgrbpppbkm0000gn/T/codex-clipboard-48bb82f4-d78b-4932-b503-77a744556987.png`
- Memos child-page reference: `/var/folders/rj/8bh9nn6j2735plmgrbpppbkm0000gn/T/codex-clipboard-bc520a3f-cc06-4b0d-9a36-bf301a992aee.png`
- The intended interaction is one Sources container with an internal Memos settings page, not a nested dialog.

## Implementation evidence

- Sources state: `/private/tmp/wikinote-sources-aligned-icons.png`
- Memos child-page state: `/private/tmp/wikinote-memos-logos-modal.png`
- Runtime: local Vite app opened in an isolated Chrome session
- Modal size measured in both states: `448 x 600` CSS pixels

## Visual verification

- The Sources header, active count, close affordance, and Memos child-page header share the same modal shell.
- Language plus Wikipedia, Hacker News, and Memos use a shared 44 x 44 circular icon slot in the same left column; the adapter-level `logoSrc` contract keeps future sources compatible.
- All three source switches share one right-side alignment column; Memos settings sits immediately to the left of its switch.
- The Memos source no longer uses the previous purple placeholder accent; the feed badge and title hover treatment use the neutral slate palette.
- The Memos child page keeps the supplied mascot asset, two configuration fields, token visibility control, and Save action without legacy helper or test-connection blocks.
- The source list retains deliberate whitespace below the compact controls so the list and child page remain the same size without adding explanatory clutter.

## Interaction checks

- Sources button opens the modal.
- Memos settings enters the child page inside the same outer modal.
- Back to Sources returns to the list.
- Memos page exposes `memos-endpoint` and `memos-token` inputs.
- Token visibility toggles between password and text mode.
- Save persists the draft fields and returns to the source list without changing the Memos enable switch.
- Clicking an unconfigured Memos switch leaves it off, shows `Configure Memos before enabling it`, and opens the existing child settings page.
- No nested dialog, legacy configuration text, or runtime exception was observed.

## Findings

- No actionable P0, P1, or P2 visual findings remain for the requested Sources/Memos flow.

## Web install entry — 2026-08-12

### Evidence

- Source visual truth: `/private/tmp/wikinote-web-before-20260812.png`
- Browser-rendered implementation: `/private/tmp/wikinote-web-final-20260812.png`
- Focused toolbar comparison: `/private/tmp/wikinote-web-toolbar-comparison.png`
- Viewport and pixels: both source and implementation are `1280 x 720` CSS pixels at device scale factor `1`; no density normalization was required.
- State: desktop web, Waves theme, toolbar at rest. Dynamic feed content differs because both captures use the product's normal random selection; the toolbar region is state-equivalent.

### Full-view comparison

- The reading surface, content hierarchy, background composition, and persistent toolbar remain unchanged.
- The install entry occupies unused space immediately before the existing utility icons and does not compete with the article.

### Focused-region comparison

- The focused toolbar comparison was required because the new control is too small to judge precisely in the full-view capture.
- The CTA follows the toolbar geometry and uses the existing translucent surface, border, typography, and restrained motion language.
- Benefit-led copy explains the outcome without promotional language; the entry is web-only and hidden on narrow viewports.

### Fidelity surfaces

- Fonts and typography: the existing sans-serif UI family, compact size, medium optical weight, and single-line label are preserved.
- Spacing and rhythm: the pill aligns vertically with the existing controls and uses an `8px` handoff gap before the icon group.
- Colors and tokens: the light neutral surface, slate foreground, subtle white border, and existing focus treatment remain within the current palette.
- Images and icons: the Chrome mark comes from the project's existing Lucide icon system; no raster asset or custom-drawn approximation was introduced.
- Copy: `Make this my new tab` is concise, benefit-led, and avoids advertising language.

### Interaction and verification

- The CTA opens the published Chrome Web Store listing in a new tab and records a first-party Vercel Analytics event.
- Vercel's analytics script is injected by the web entry point only; the extension build excludes both the CTA and analytics bootstrap.
- Responsive verification at `760 x 720` confirmed the toolbar CTA is hidden before it would crowd the utility icons.
- Browser console errors checked: none observed.
- Web and extension production builds, lint, packaging, regression checks, and whitespace validation passed.
- The extension production bundle does not contain the CTA copy, store URL, or click event.

### Findings and comparison history

- Initial comparison: no P0, P1, or P2 discrepancy was identified; no visual fix iteration was required.
- No actionable P0, P1, or P2 findings remain. Outbound click volume can be reviewed before considering any stronger promotion.

## Final result

passed
