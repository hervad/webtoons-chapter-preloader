# Security policy

## Supported versions

Only the latest version gets fixes. The userscript and the Toonlight Preloader extension update automatically, so please check that you're on the newest one (see [Releases](https://github.com/hervad/webtoons-chapter-preloader/releases)).

## What the script does and doesn't do

The preloader runs only on Webtoons' chapter reader (`www.webtoons.com/*/viewer*` and `m.webtoons.com/*/viewer*`). It copies each chapter image's address from the page itself (the `data-url` attribute, or the mobile reader's own image list) into the image, so the browser downloads it from Webtoons' image server, the same request the site makes when you scroll to it. It has no permissions beyond that page (`@grant none` for the userscript, no extension permissions), stores nothing, makes no requests of its own and sends no data anywhere.

## Reporting a problem

If you find a security issue (for example, a way for a page to make the script load something it shouldn't), please report it **privately** through [Report a vulnerability](https://github.com/hervad/webtoons-chapter-preloader/security/advisories/new) instead of opening a public issue. You'll get a reply as soon as possible, and the fix will ship as a new version.
