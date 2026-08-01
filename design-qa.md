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

## Final result

passed
