# Chrome Web Store submission guide

This guide describes the current Wikinote Chrome extension release. Keep it aligned with `configs/extension/manifest.json`, `README.md`, and the root [`PRIVACY.md`](../PRIVACY.md).

## Current release

- Extension version: `2.0.6`
- Manifest: `configs/extension/manifest.json`
- Build output: `dist/extension/`
- Submission package: `dist/wikinote-extension-v2.0.6.zip`
- Privacy policy source: [`PRIVACY.md`](../PRIVACY.md)
- Public privacy policy URL after it is pushed to `main`:
  `https://github.com/covee-studio/wikinote/blob/main/PRIVACY.md`

## Store description

### Single purpose description

```text
Wikinote replaces the Chrome new tab page with a calm reading space that presents one randomly selected item at a time from enabled sources such as Wikipedia, Hacker News, the user's Memos notes, and Hypothesis annotations. Users can discover and revisit knowledge, save favorites, optionally sync compact favorite previews through Chrome Sync, and translate supported headlines with Chrome's on-device language APIs. Wikinote does not inject content into ordinary webpages, display ads, or track browsing activity.
```

### Short description

```text
A quiet new tab for discovering Wikipedia, Hacker News, notes, and annotations.
```

### Detailed description

```text
Turn every new tab into a quiet moment of discovery.

Wikinote presents one carefully formatted item at a time from the sources you choose:

• Wikipedia articles in 40 languages
• Hacker News stories
• Your own notes from a self-hosted Memos instance
• Your Hypothesis annotations

Save items you want to revisit, optionally sync compact favorite previews across Chrome devices, and use Chrome's supported on-device language APIs to translate headlines. Wikinote has no ads, no browsing-history tracking, and no Wikinote account or backend.

Wikinote is open source:
https://github.com/covee-studio/wikinote
```

## Permissions

### `storage`

```text
Wikinote uses Chrome storage to persist language and appearance preferences, enabled sources, local feed cache, source configuration, and liked article records so the new-tab reading experience can be restored across browser sessions. When the user explicitly enables Sync favorites, compact favorite previews are stored in Chrome Sync. API tokens and private source credentials remain local and are not synchronized. Wikinote does not send this data to a Wikinote server.
```

### `unlimitedStorage`

```text
Wikinote stores cached feed data, liked articles, and compact source previews locally so users can revisit content across browser sessions. The additional capacity supports larger personal reading histories and cached content without relying on the normal extension storage quota. It is used only for Wikinote's reading and favorites features.
```

### Host permission: `https://*.wikipedia.org/*`

```text
Wikinote uses Wikipedia host access to retrieve public article titles, extracts, images, and links for the new-tab reading experience. Requests are made only for Wikipedia content selected by the enabled Wikipedia source. The extension does not inject scripts into Wikipedia pages or monitor browsing activity.
```

### Host permission: `https://hacker-news.firebaseio.com/*`

```text
Wikinote uses the public Hacker News Firebase API to retrieve story titles, links, and related public metadata for the enabled Hacker News source. This access is required to populate the new-tab reading experience. The extension does not access private account data or monitor browsing activity.
```

### Host permission: `https://hypothes.is/*`

```text
Wikinote uses the Hypothesis API to retrieve annotations for the Hypothesis account identified by the personal API token entered by the user. This access is required to display the user's selected quotations, annotation text, document metadata, and links in the new-tab reading experience. The token is stored locally and is sent only to Hypothesis. The extension does not inject scripts into Hypothesis pages or monitor browsing activity.
```

### Optional host permissions: user-configured Memos endpoint

```text
Wikinote requests access only to the self-hosted Memos endpoint entered by the user and only when the Memos source is configured. The access is required to retrieve the user's notes and related metadata. The Memos API token is stored locally and sent only to that configured endpoint. Wikinote does not send Memos content or credentials to a Wikinote server and does not access unrelated pages.
```

## Remote code

Select:

```text
No, I am not using remote code
```

Wikinote fetches data from public and user-configured APIs, but all JavaScript shipped by the extension is included in the extension package. API responses are treated as data; the extension does not download or execute remote JavaScript.

## Privacy and data usage

### Privacy policy URL

After `PRIVACY.md` has been pushed to the public `main` branch, enter:

```text
https://github.com/covee-studio/wikinote/blob/main/PRIVACY.md
```

Do not use the repository homepage as a substitute for the privacy policy.

### Data categories

Select the categories that exist in the current dashboard and accurately describe the extension:

- Personally identifiable information — source usernames may be supplied for Hypothesis.
- Authentication information — Memos and Hypothesis API tokens are entered by the user and stored locally.
- Website content — Wikipedia, Hacker News, Memos, and Hypothesis content is retrieved or displayed by the extension.

If the dashboard does not offer a separate “User-generated content” category, do not invent one or select an unrelated category. The privacy policy explains that Memos notes and Hypothesis quotations/annotation text may contain user-generated content.

Do not select health information, financial or payment information, personal communications, location, web history, or user activity unless the product behavior changes.

Check all three Limited Use certifications:

- user data is not sold or transferred for unrelated purposes;
- user data is not used or transferred for unrelated purposes; and
- user data is not used or transferred for creditworthiness or lending.

## Build and verify

Run from `frontend/`:

```bash
npm run lint
npx tsc -b
npm run verify:regressions
npm run build:extension
npm run pack:extension
```

Before uploading, verify that the package contains the current version in `manifest.json` and that no API tokens, local configuration, or development files are present.

## Submission sequence

1. Push the privacy policy and release changes to the public `main` branch.
2. Confirm the privacy policy URL opens in an incognito window.
3. Upload the new extension zip in the Chrome Web Store Developer Dashboard.
4. Update the Privacy fields using the text above.
5. Click **Save draft** and resolve validation errors.
6. Review the package, permissions, and data disclosures.
7. Click **Submit for review** only after the final local installation test passes.

The new Hypothesis host permission may receive additional review because it was added after the previous store version. No new permission is introduced by the translation UI fix in version 2.0.6.
