# Wikinote Privacy Policy

Last updated: September 5, 2026

Wikinote is a Chrome extension that turns the new tab page into a quiet reading space. This privacy policy explains what the extension processes, where that data goes, and what controls are available to you.

## Summary

- Wikinote has no Wikinote backend, account system, advertising, or usage tracking in the Chrome extension.
- API tokens and private source credentials are stored locally in the browser and are not uploaded to Wikinote.
- Wikinote sends source-specific requests only to the service selected or configured by you.
- Chrome Sync is optional. It is used only when you explicitly enable “Sync favorites”.
- Only compact favorite previews are synchronized; source credentials and API tokens are never synchronized.
- WeRead (微信读书) favorites are local-only and excluded from Chrome Sync.

## Information processed by the extension

### Settings and local application data

Wikinote stores settings and application data in Chrome storage and, for fast startup compatibility, a local browser mirror. This may include:

- selected language and appearance preferences;
- enabled sources and source configuration;
- locally cached feed items; and
- liked or saved article records.

Memos instance URLs, Memos API tokens, Hypothesis API tokens, optional Hypothesis usernames, and WeRead API Keys are stored locally. They are not sent to Wikinote or stored in Chrome Sync.

### Content from enabled sources

Wikinote retrieves content only from sources enabled by you:

- **Wikipedia**: public article titles, extracts, images, and links.
- **Hacker News**: public story titles, links, scores, authors, timestamps, and comment counts.
- **Memos**: notes and related metadata from the self-hosted Memos endpoint you configure.
- **WeRead (微信读书)**: your notebook index, book and chapter metadata, personal highlights, and reading thoughts. The integration requests only the official notebook, highlight, and personal review endpoints. It does not request full book text or public recommendations.
- **Hypothesis**: annotations visible to your API token, including quotations, annotation text, document metadata, tags, timestamps, and links. Setting a username filters the search to that user; without a username, results may also include other users' public annotations.

Memos and Hypothesis content may contain personal or user-generated information because it is content you or your service account chose to store there. Wikinote displays that content for the reading experience and does not claim ownership of it.

### Chrome Sync favorites

If you explicitly enable “Sync favorites”, Wikinote stores compact favorite previews in Chrome’s `storage.sync` area so they can be available on your other Chrome devices signed into the same Chrome profile. Depending on the source, a preview can include a title, URL, source identifier, a short excerpt or selected quotation, annotation text, tags, and limited display metadata.

Wikinote does not synchronize full private Memos notes, API tokens, source credentials, or WeRead favorites. Chrome processes synced data according to your Chrome account and Google privacy settings. Wikinote does not receive a copy of this synchronized data on its own servers.

### On-device translation

When supported by the browser and enabled by your language selection, Wikinote uses Chrome’s on-device language APIs to translate supported headlines. Wikinote does not send translation requests to a Wikinote server.

## Where requests are sent

Requests are sent directly from the extension to the relevant source service:

- Wikimedia/Wikipedia public APIs for Wikipedia content;
- the Hacker News Firebase API for Hacker News content;
- `https://i.weread.qq.com/api/agent/gateway` when you enable WeRead and grant access to that host;
- the Hypothesis API when the Hypothesis source is configured; and
- the Memos API endpoint entered by you when the Memos source is configured.

For Memos, use an HTTPS endpoint. The current Chrome extension's connection security policy does not allow plain HTTP API requests.

Wikinote does not inject scripts into ordinary webpages or monitor your browsing history.

## Sharing and sale

Wikinote does not sell user data. The Chrome extension does not transfer user data to Wikinote, advertising networks, data brokers, or analytics providers. Source data is sent to a source service only as needed to retrieve the content requested by you, and Chrome Sync data is handled by Chrome when you explicitly enable synchronization.

## Retention and deletion

Local settings, caches, and favorites remain in your browser until you remove them through the extension, clear the extension’s storage, or uninstall the extension. Disconnecting a source removes its key and local fetch caches; saved favorites and recent items are retained until you remove them separately. Disabling Chrome Sync stops this profile's synchronization but does not delete data already stored in your Chrome account. Source services retain data according to their own policies and account controls.

You can:

- disable any source in the Sources panel;
- disconnect a source and remove its credentials from its settings page;
- delete liked articles from the Likes panel;
- disable “Sync favorites” at any time; and
- clear Wikinote’s extension data through Chrome’s extension settings.

## Security

Wikinote keeps source credentials in local browser storage and excludes them from Chrome Sync. You are responsible for choosing a trusted Memos endpoint, protecting your API tokens, and using HTTPS for self-hosted services.

Local storage is not an encrypted password vault. Protect access to your browser profile and revoke a key with its source service if it has been exposed. Close other Wikinote tabs before disconnecting a source; already-open tabs do not yet receive source-setting changes in real time.

## Changes to this policy

This policy may be updated when Wikinote’s data practices or features change. The “Last updated” date at the top of this page indicates the latest revision.

## Contact

For privacy questions or requests, open an issue in the project repository:

<https://github.com/covee-studio/wikinote/issues>

Source services have their own privacy policies and terms. Please review them when using those services, including [Wikimedia](https://foundation.wikimedia.org/wiki/Policy:Privacy_policy), [Hypothesis](https://web.hypothes.is/privacy/), and [Google Chrome](https://policies.google.com/privacy).
