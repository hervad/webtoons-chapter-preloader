Webtoons.com lazy-loads chapter images as you scroll, so every time a new panel comes into view there's a brief blank flash, especially on slower connections or long chapters. This script downloads the whole chapter while the page is still opening, and gets the next few panels ready to paint before you reach them. By the time you scroll, there's nothing left to wait for.

> **No userscript manager?** The same preloader is also a browser extension, **Toonlight Preloader**: one click to install, nothing to set up. Get it for [Chrome, Brave and Opera](https://chromewebstore.google.com/detail/toonlight-preloader-for-w/kanadpglihpekgidpopkpblcheoinekh) or [Edge](https://microsoftedge.microsoft.com/addons/detail/toonlight-preloader-for-w/mpgabnfjnfleojaokcojabpcpfnnpgfd). Use either the script or the extension, not both.

## Getting started

Click **Install this script** above, then open any chapter on webtoons.com. A small bubble in the bottom-right corner (top-right on the mobile site) shows the progress (`Preloading 37 / 126…`, then `✓ Preloaded 126 images`) and fades out. Updates arrive automatically through Greasy Fork.

It works in Tampermonkey, Violentmonkey and Greasemonkey, on the desktop site and on your phone (Firefox for Android with Violentmonkey or Tampermonkey).

**Chrome, Edge and other Chromium browsers:** the browser needs an extra permission before any userscript can run. Open `chrome://extensions`, click **Details** on your userscript manager, and turn on **Allow User Scripts**. On Chrome versions before 138, turn on **Developer mode** (top-right of `chrome://extensions`) instead.

## How it works

- **Downloads start early.** The script runs as soon as the page starts loading and starts on the chapter while the page is still opening, instead of waiting for the rest of the page. In a test on a 124-panel chapter, every panel had finished downloading before the page itself was done loading.
- **Panels are ready before you reach them.** Browsers only prepare (decode) images that are close to the screen, so a fast scroll can show an image blank for a moment even when it's already downloaded. The script prepares the panels up to three screens ahead of where you're reading. It does this a few at a time, so it doesn't fill your memory with the whole chapter.
- **Panel 1 comes first.** It's requested on its own, then the rest of the first screen, then the whole remaining chapter at once. WEBTOON's image server answers each image after a different delay, so asking for everything at once used to bring the panels back in random order, with panel 1 sometimes after dozens of others. On a fresh episode the server can still take a moment for an occasional image.
- **Your page stays put.** The script never scrolls the page to make images load, and there's nothing to set up.
- **Screen readers** hear the final result once, not every count.
- **Failed images don't leave you hanging.** If an image can't be loaded, the bubble says so (`⚠ Preloaded 125 / 126 images (1 failed)`) instead of waiting forever.

## Data usage

The whole chapter is downloaded as soon as you open it, typically 10–20 MB, about 3–4 times what the site loads up front on its own. If you open a chapter and leave after a few panels, the rest was downloaded for nothing. On a phone it's less, usually 2–3 MB, because the mobile site shows part of the chapter and serves smaller images. On a metered connection you may want to turn the script off.

## Privacy

The script uses `@grant none`: it has no userscript-manager permissions beyond reading and changing the page. It stores nothing, makes no requests of its own and sends no data anywhere. The images it loads are the same ones the page would load as you scroll, from Webtoons' own image server.

## Compatibility

- Desktop site (`www.webtoons.com`) and mobile site (`m.webtoons.com`). On the mobile site, Webtoons shows only part of some chapters (the rest is in its app); the script preloads what the page shows.
- If Webtoons changes how its reader is built, the script may silently stop working. Please report it if you notice.

## Also try: Webtoons Dark Mode

[**Webtoons Dark Mode**](https://greasyfork.org/scripts/577859) is a dark theme for the whole site that keeps the comic's colours exactly as the artist drew them. Unlike dark-mode extensions that invert the page, it never filters or recolours the panels: skin tones stay skin tones. It covers the header and menus, series pages, the reader, comments and popups, and adds a night-reading dim for the panels.

The two scripts are made to work together and are tested side by side. Prefer an extension? The same theme is available as **Toonlight** for [Chrome, Brave and Opera](https://chromewebstore.google.com/detail/toonlight-dark-mode-for-w/jefblpkbipgmpefdnninpnofkjckpafn), [Edge](https://microsoftedge.microsoft.com/addons/detail/toonlight-dark-mode-for-/iheadalpoiialennkmndleakobiilcfm) and [Firefox](https://addons.mozilla.org/firefox/addon/toonlight/).

## Source and issues

Source code and changelog: [github.com/hervad/webtoons-chapter-preloader](https://github.com/hervad/webtoons-chapter-preloader). Bug reports are welcome; please include the chapter URL where the problem happens.

License: MIT
