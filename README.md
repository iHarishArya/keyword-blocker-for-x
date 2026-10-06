# Keyword Filter for X Timeline

A Chrome extension that hides posts on your X (Twitter) timeline when they match keywords or regex patterns you choose.

## Features
- Case-insensitive keyword and phrase matching
- Optional regex: wrap a pattern in slashes, e.g. `/\b(spoiler|leak)s?\b/`
- Matches post text, quoted posts, link cards, and display names/handles
- One-click on/off switch and a hidden-post counter
- Changes apply instantly to open tabs

## Install (from source)
1. Download or clone this repo.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select this folder.

## Support
Found a bug, or X changed its layout and posts are no longer hidden? Please open an issue on the **Issues** tab of this repository

## Privacy Policy
Last updated: 2026-10-06

Keyword Filter for X Timeline does not collect, transmit, sell, or share any personal data.

- **What is stored:** your keyword list, an on/off setting, and a count of hidden posts, saved with Chrome's built-in storage (chrome.storage). If Chrome Sync is on, Google may sync the keyword list and on/off setting across your devices; the developer has no access to it.
- **What is read:** the extension reads the text of posts shown on x.com and twitter.com only to compare it with your keywords, locally in your browser. This content is never saved or sent anywhere.
- **Network requests:** none.
- **Third parties:** none.

*Not affiliated with, endorsed by, or sponsored by X Corp.*
