# Contributing

Thanks for helping! Bug reports with a chapter URL are the most useful contribution: Webtoons changes its reader now and then, and a report is usually all it takes to fix a chapter that stopped preloading.

## How the project is built

- **One file:** `webtoons-preloader.user.js` is the whole preloader, for the desktop reader and the mobile one (`m.webtoons.com`). It ships as it is; there is no build step for the userscript.
- **The Toonlight Preloader browser extension** packages that same file, byte for byte, as its content script: `node tools/build-extension.mjs` (Node 22+, no dependencies) writes `dist/chrome/`, `dist/firefox/` and a zip of each. Don't add extension-only code to the userscript; the extension has none.
- **No permissions beyond the reader page.** The userscript uses `@grant none`, and the extension asks for nothing but its content-script match. Changes that need storage, extra hosts or network requests of their own need a good reason and an update to [PRIVACY.md](PRIVACY.md).

## Making a change

1. Test the userscript: in your userscript manager's dashboard, create a new script, select all of the template (Ctrl+A) and paste the whole file over it. The manager reads only the first `// ==UserScript==` header, so pasting below the template leaves the template's `@match` in charge. Disable any installed copy while testing.
2. Test the extension: `node tools/build-extension.mjs`, then load `dist/chrome/` at `chrome://extensions` (Developer mode → **Load unpacked**) or `dist/firefox/manifest.json` at `about:debugging` → **This Firefox** → **Load Temporary Add-on**.
3. Open a long chapter with the browser's network panel open, on the desktop site and on the mobile site (device emulation in the developer tools, or a phone; check that each image is requested once, in one size). Every chapter image should start downloading while the page is still loading, and the bubble should end on `✓ Preloaded N images`.

## Conventions

- Comments say **why** the code does something (what broke without it), not what it does.
- Keep `#__wt_preloader_status` as the bubble's ID: [Webtoons Dark Mode](https://github.com/hervad/webtoons-dark-mode) recognises the bubble by it.
- Never inject text in a language other than the bubble's own short status lines.
- Don't add next-chapter prefetching: the preloader loads the chapter you opened, nothing else.

## Pull requests

Keep a pull request to one change and leave `@version` alone: versions are bumped on release.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).
