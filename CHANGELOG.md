# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-10-08

### Added
- **Browser extension: Toonlight Preloader** for Chrome, Edge and Firefox (also Firefox for Android), coming to the stores. It's this same script, packaged byte for byte by `node tools/build-extension.mjs`, with no permissions beyond WEBTOON's chapter pages. Store guide in `extension/STORE.md`, privacy policy in `PRIVACY.md`.
- **Mobile site (`m.webtoons.com`).** The mobile reader has no `data-url`, so the script reads the chapter's image list from the page's inline script and builds each panel's URL and `srcset` the way the site's viewer does, then preloads every panel the page shows. A safety check compares its URLs with the ones the viewer set on the first panels and does nothing if they differ, so a site change can't make images download twice.
- **Screen readers** hear the final result ("Preloaded 124 images", or how many failed) from a visually hidden `role="status"` element; the running count stays silent.
- **One copy per page:** with both the userscript and the extension installed, the first to start claims the page (`html[data-wt-preloader]`) and the other stops, instead of both decoding and tracking the bubble. A copy injected before `<html>` exists claims at `DOMContentLoaded`.
- Community files: issue forms, pull request template, contributing guide, security policy, accessibility statement, code of conduct.

### Changed
- On the mobile site the bubble sits top-right, below the header, so it doesn't cover the reader's bottom toolbar.
- The bubble's text changes through text nodes instead of replacing its children, so it no longer produces a `childList` mutation per image (Webtoons Dark Mode filtered those; other scripts' observers no longer see them either).

## [1.1.0] - 2026-10-08

### Added
- Images up to three screens below the viewport are pre-decoded with `img.decode()` (rolling window, `DECODE_AHEAD`), so a fast scroll doesn't show already-downloaded images blank while Firefox decodes them.
- `greasyfork.md` holds the Greasy Fork page text, so it is versioned with the script. README and Greasy Fork now link to [Webtoons Dark Mode](https://github.com/hervad/webtoons-dark-mode).

### Fixed
- Progress bubble no longer hangs at "Preloading N-1 / N…" when an image fails to load; failed images now count as settled and the bubble reports them (`⚠ Preloaded 49 / 50 images (1 failed)`).

### Changed
- Runs at `document-start` and starts each download as the parser creates the `<img>`, instead of waiting for the rest of the page and its scripts (`document-idle`).
- The first 3 images get `fetchPriority = 'high'` so the top of the chapter arrives first instead of competing with the whole chapter.
- `loading`/`decoding` hints are set before `src`, so they apply to the request that `src` starts.
- Progress listeners are removed once every image has settled, so the site's own lazy loader re-setting `src` while scrolling can't re-show the bubble.
- Docs: "How it works" corrected (the site's lazy loader is scroll-based, and desktop has no in-place chapter navigation); Chromium setup now describes the **Allow User Scripts** toggle (Chrome 138+); data-usage note added.

### Removed
- The page-lifetime `MutationObserver` on `<html>`. Chapter changes on desktop are full page loads, so it only ever reacted to comments and ads; the observer now lives only until `DOMContentLoaded`.

## [1.0.0] - 2026-04-29

### Added
- Initial release.
- Preloads every image in a Webtoons chapter on page open by copying `data-url` → `src` for elements under `#_imageList`.
- Sets `loading="eager"` and `decoding="async"` on each image to encourage immediate fetch.
- `MutationObserver` re-runs the preloader when Webtoons swaps the image list during in-place navigation between chapters (debounced to 100 ms).
- Floating status bubble in the bottom-right corner showing preload progress, with auto-fade on completion.
