# Webtoons Chapter Preloader

A small userscript that force-loads every image in a [Webtoons](https://www.webtoons.com) chapter as soon as the page opens, instead of lazy-loading them on scroll. The result is no more blank-image stutter while reading.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Greasy Fork version](https://img.shields.io/greasyfork/v/575967.svg)](https://greasyfork.org/en/scripts/575967-webtoons-chapter-preloader)
[![Greasy Fork installs](https://img.shields.io/greasyfork/dt/575967.svg)](https://greasyfork.org/en/scripts/575967-webtoons-chapter-preloader)

## What it does

Webtoons.com lazy-loads chapter images as you scroll, which produces a brief blank-image flash every time a new panel comes into view — especially noticeable on slower connections or long chapters. This script asks the browser to fetch the entire chapter while the page is still opening, and decodes images a few screens ahead of where you're reading. By the time you scroll, every image is already in cache and the next few are ready to paint.

## Install

**Recommended (with auto-updates):**

[Install from Greasy Fork](https://greasyfork.org/en/scripts/575967-webtoons-chapter-preloader) — open the page in a browser that has a userscript manager installed, then click the green **Install this script** button.

**Manual:**

1. Install a userscript manager. Any of these work:
   - [Tampermonkey](https://www.tampermonkey.net/) — Chrome, Edge, Firefox, Safari, Opera
   - [Violentmonkey](https://violentmonkey.github.io/) — Chrome, Edge, Firefox
   - [Greasemonkey](https://www.greasespot.net/) — Firefox
2. Open the [raw `.user.js` file](https://raw.githubusercontent.com/hervad/webtoons-chapter-preloader/main/webtoons-preloader.user.js) and confirm the install prompt.

> **Chrome, Edge and other Chromium browsers:** the browser needs an extra permission before any userscript can run. Open `chrome://extensions`, click **Details** on your userscript manager, and turn on **Allow User Scripts**. On Chrome versions before 138, turn on **Developer mode** (top-right of `chrome://extensions`) instead.

## How it works

Webtoons stores the real image URL in each `<img data-url="...">` (with a transparent placeholder in `src`) and its own viewer script copies `data-url` into `src` as images scroll near the viewport.

The script runs at `document-start`. While the page is still being parsed, a short-lived `MutationObserver` sets each chapter image's `src` from `data-url` the moment the `<img>` is created — the image list sits in the middle of a large page followed by render-blocking scripts, so this starts the downloads well before the page finishes loading. The first few images also get `fetchPriority="high"` so the top of the chapter arrives first. At `DOMContentLoaded` the observer is disconnected and one final pass catches anything it missed (chapter changes on desktop are full page loads, so nothing needs watching after that).

Downloading isn't the whole story: Firefox only decodes images within about one screen of the viewport, so a fast scroll can still show an already-downloaded image blank for a moment. An `IntersectionObserver` calls `img.decode()` on images up to three screens below the viewport. It's a rolling window — decoded images cost a few MB each, so the whole chapter is never decoded at once.

A small status bubble in the bottom-right corner shows preload progress and fades out once everything's loaded. If any image fails to load, the bubble says how many (e.g. `⚠ Preloaded 49 / 50 images (1 failed)`) instead of waiting forever.

The script uses `@grant none`, so it has no userscript-manager privileges beyond plain DOM access — no network APIs, no storage, nothing it could exfiltrate even in principle.

## Configuration

The settings are constants at the top of the script:

```js
const IMG_SELECTOR  = '#_imageList img';   // change if Webtoons reworks the viewer markup
const STATUS_ID     = '__wt_preloader_status'; // don't rename: Webtoons Dark Mode recognises the bubble by this ID
const HIGH_PRIORITY = 3;                    // how many top-of-chapter images get fetchPriority="high"
const DECODE_AHEAD  = '300%';               // pre-decode images this many viewport heights below the screen
```

If you don't want the progress bubble, delete the `trackProgress(imgs)` call in `finish()`.

## Compatibility

- Tampermonkey, Violentmonkey, Greasemonkey
- Chromium browsers: Chrome, Edge, Brave, Opera, Vivaldi
- Firefox (stable + ESR)
- Desktop only; `m.webtoons.com` is not matched (see Known Issues)

## Known issues

- **Mobile site not covered.** The `@match` only targets `www.webtoons.com/*/viewer*`. `m.webtoons.com` builds its `<img>` elements from a JavaScript image list at runtime (there is no `data-url` in its HTML), so supporting it needs a separate code path, not just another `@match` line.
- **Data usage.** The whole chapter is downloaded as soon as the page opens — typically 10–20 MB, about 3–4× what the site loads up front on its own. If you open a chapter and leave after a few panels, the rest was downloaded for nothing. On a metered or slow connection you may want to disable the script.
- **Selector drift.** If Webtoons changes the `#_imageList` ID or the `data-url` attribute name, the script will silently do nothing until `IMG_SELECTOR` is updated. Please open an issue if you notice this.

## Also by the author

[Webtoons Dark Mode](https://github.com/hervad/webtoons-dark-mode) ([Greasy Fork](https://greasyfork.org/scripts/577859)) is a dark theme for WEBTOON that keeps the comic's colours exactly as the artist drew them: it restyles the site around the comic and never filters or recolours the panels. It's also available as the **Toonlight** browser extension for [Chrome](https://chromewebstore.google.com/detail/toonlight-dark-mode-for-w/jefblpkbipgmpefdnninpnofkjckpafn) and [Edge](https://microsoftedge.microsoft.com/addons/detail/toonlight-dark-mode-for-/iheadalpoiialennkmndleakobiilcfm). The two scripts are tested together and work side by side.

## Contributing

Issues and pull requests welcome. For bug reports, including a chapter URL where the issue reproduces is helpful (the markup occasionally varies by genre/locale).

The Greasy Fork page text lives in [`greasyfork.md`](greasyfork.md); its one-line summary is the script's `@description`. Changes are listed in [`CHANGELOG.md`](CHANGELOG.md).

To test a change, open your userscript manager's dashboard, create a new script, select all of the template (Ctrl+A) and paste the whole file over it. The manager reads only the first `// ==UserScript==` header, so pasting below the template leaves the template's `@match` in charge and the script never runs on chapter pages. Disable any installed copy of the script while testing.

## License

MIT — see [LICENSE](LICENSE).
