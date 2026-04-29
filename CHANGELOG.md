# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-29

### Added
- Initial release.
- Preloads every image in a Webtoons chapter on page open by copying `data-url` → `src` for elements under `#_imageList`.
- Sets `loading="eager"` and `decoding="async"` on each image to encourage immediate fetch.
- `MutationObserver` re-runs the preloader when Webtoons swaps the image list during in-place navigation between chapters (debounced to 100 ms).
- Floating status bubble in the bottom-right corner showing preload progress, with auto-fade on completion.
