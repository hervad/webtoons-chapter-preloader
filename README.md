# Webtoons Chapter Preloader

A small userscript that force-loads every image in a [Webtoons](https://www.webtoons.com) chapter as soon as the page opens, instead of lazy-loading them on scroll. The result is no more blank-image stutter while reading.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Greasyfork version](https://img.shields.io/greasyfork/v/575967.svg)](https://greasyfork.org/en/scripts/575967-webtoons-chapter-preloader)
[![Greasyfork installs](https://img.shields.io/greasyfork/dt/575967.svg)](https://greasyfork.org/en/scripts/575967-webtoons-chapter-preloader)

## What it does

Webtoons.com lazy-loads chapter images as you scroll, which produces a brief blank-image flash every time a new panel comes into view — especially noticeable on slower connections or long chapters. This script asks the browser to fetch the entire chapter immediately on page open. By the time you scroll, every image is already in cache.

It also handles the in-place navigation Webtoons uses between chapters: when the image list swaps without a full page reload, the preloader re-runs automatically.

## Install

**Recommended (with auto-updates):**

[Install from Greasyfork](https://greasyfork.org/en/scripts/575967-webtoons-chapter-preloader) — open the page in a browser that has a userscript manager installed, then click the green **Install this script** button.

**Manual:**

1. Install a userscript manager. Any of these work:
   - [Tampermonkey](https://www.tampermonkey.net/) — Chrome, Edge, Firefox, Safari, Opera
   - [Violentmonkey](https://violentmonkey.github.io/) — Chrome, Edge, Firefox
   - [Greasemonkey](https://www.greasespot.net/) — Firefox
2. Open the [raw `.user.js` file](https://raw.githubusercontent.com/hervad/webtoons-chapter-preloader/main/webtoons-preloader.user.js) and confirm the install prompt.

> **Chrome users:** since Manifest V3, Tampermonkey requires Developer Mode to be enabled in `chrome://extensions/` for userscripts to actually run. Flip the toggle in the top-right of that page once.

## How it works

Webtoons stores the real image URL in each `<img data-url="...">` and lazy-replaces `src` on scroll using IntersectionObserver. The script does a one-pass copy: for every image inside `#_imageList`, set `src` from `data-url`, then set `loading="eager"` and `decoding="async"` to nudge the browser to fetch immediately. A `MutationObserver` rooted on `<html>` re-runs the same pass whenever new images appear (chapter changes, dynamically inserted nodes).

A small status bubble in the bottom-right corner shows preload progress and fades out once everything's loaded.

The script uses `@grant none`, so it has no userscript-manager privileges beyond plain DOM access — no network APIs, no storage, nothing it could exfiltrate even in principle.

## Configuration

The two values most likely to need updating are constants at the top of the script:

```js
const IMG_SELECTOR = '#_imageList img';   // change if Webtoons reworks the viewer markup
const STATUS_ID    = '__wt_preloader_status';
```

If you don't want the progress bubble, delete the `trackProgress()` call in `run()`.

## Compatibility

- Tampermonkey, Violentmonkey, Greasemonkey
- Chromium browsers: Chrome, Edge, Brave, Opera, Vivaldi
- Firefox (stable + ESR)
- Desktop only; `m.webtoons.com` is not matched (see Known Issues)

## Known issues

- **Mobile site not covered.** The `@match` only targets `www.webtoons.com/*/viewer*`. To use on `m.webtoons.com`, add a second `@match` line — selectors may need adjusting.
- **Selector drift.** If Webtoons changes the `#_imageList` ID or the `data-url` attribute name, the script will silently do nothing until `IMG_SELECTOR` is updated. Please open an issue if you notice this.

## Contributing

Issues and pull requests welcome. For bug reports, including a chapter URL where the issue reproduces is helpful (the markup occasionally varies by genre/locale).

## License

MIT — see [LICENSE](LICENSE).
