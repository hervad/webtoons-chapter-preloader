## What and why

<!-- What the change does, and what didn't work before. -->

## Checklist

- [ ] Tested on a long chapter (100+ images) with the browser's network panel open: every image starts downloading before the page finishes loading, and the bubble ends on "✓ Preloaded N images"
- [ ] Tested on the mobile site too (`m.webtoons.com`, with phone emulation or a phone): each image is requested once, in one size
- [ ] Still works as both the userscript and the extension (`node tools/build-extension.mjs`, then load `dist/chrome` or `dist/firefox`), and with both installed only one copy runs
- [ ] No new permissions, grants or network requests of its own
- [ ] `@version` is left alone (the maintainer bumps it on release)
