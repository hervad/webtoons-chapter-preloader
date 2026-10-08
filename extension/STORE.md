# Publishing Toonlight Preloader

How to put the extension on the three stores. Build first:

```bash
node tools/build-extension.mjs
```

This writes `dist/toonlight-preloader-<version>-chrome.zip` (Chrome and Edge) and `dist/toonlight-preloader-<version>-firefox.zip` (Firefox). The version is the userscript's `@version`; a store rejects an upload whose version isn't higher than the published one.

The package holds `manifest.json`, the icons and `webtoons-preloader.user.js` **byte for byte** (the build copies it; nothing is generated, minified or bundled). So, unlike Toonlight, AMO needs no source zip, and anyone can check a package against GitHub:

```bash
unzip -p dist/toonlight-preloader-<version>-firefox.zip webtoons-preloader.user.js | sha256sum
sha256sum webtoons-preloader.user.js
```

## Order

1. **Commit and push** the listing copy and the build, so the repository matches the package reviewers see.
2. **Firefox Add-ons (AMO)** first: its automatic validation runs on upload and it's usually live within 24 hours, so a packaging problem shows up before the slower reviews start.
3. **Chrome Web Store** next (a few days to a couple of weeks).
4. **Microsoft Edge Add-ons** last (up to 7 business days); it reuses the Chrome package and the same answers.
5. When each listing is live: add its link and badge to the README and `greasyfork.md`.

Before each upload: `node tools/build-extension.mjs`, and check that the zip's version is the released one.

## Listing text (all stores)

**Name:** Toonlight Preloader for WEBTOON (Firefox allows 45 characters, Chrome 75; the build checks it.)

**Short description / summary** (Chrome allows 132 characters and takes it from the manifest; paste the same into AMO's summary):
> Each WEBTOON chapter ready as it opens: no waiting for panels as you scroll, on desktop or phone. Not affiliated with NAVER WEBTOON.

**Description** (paste only the text. AMO accepts Markdown, so `-` bullets work there; Edge needs at least 250 characters):
> Toonlight Preloader gets a WEBTOON chapter ready the moment you open it, so you can simply read. Take your time or flick straight to the end: the next panel is already there.
>
> Normally the site fetches each panel only as you scroll to it, so on a slow or busy connection you keep running into blank gaps and waiting for them to fill in. Toonlight Preloader starts downloading the whole chapter while the page is still opening, top of the chapter first, and prepares the next few screens before you reach them.
>
> How it feels:
> • No waiting. Panels are there when you get to them. On a fast connection, a 124-panel chapter had finished downloading before the page itself had finished loading.
> • No gaps, even on a slow connection. In our tests on a 9 Mbit/s link, reading through a chapter on a computer showed no blank panels at all, and on a phone less than half as many as without it.
> • Your page stays put. It never scrolls the page for you or jumps back to the top, the way some loaders do to force images to load. You start reading right away.
> • Nothing to set up. It's made for this one site: install it and open a chapter. No settings, no switches to turn on per site.
> • Works on your phone too. On the mobile site it loads every panel the page shows, in the image size your screen needs, each one once. Most loaders only work on the desktop site.
> • You always know where it stands. A small bubble shows the progress and fades away. If a panel can't be loaded, it tells you instead of leaving you guessing.
> • Light and private. It runs only on chapter pages and asks for nothing else: no access to other websites, no storage, no data collection, no ads, no tracking, no remote code.
> • Open source (MIT) and maintained: the same code as the Webtoons Chapter Preloader userscript.
>
> Pairs with Toonlight, the dark theme by the same developer; the two are tested together.
>
> Good to know: the chapter is downloaded when you open it, usually 10–20 MB on a computer and 2–3 MB on a phone. On a metered connection you can switch the extension off from your browser's extensions menu.
>
> Toonlight Preloader is an independent project and is not affiliated with, endorsed by or sponsored by NAVER WEBTOON. WEBTOON is a trademark of NAVER WEBTOON.
>
> Source code and changelog: https://github.com/hervad/webtoons-chapter-preloader

Why the description reads this way:

- **It sells the feeling, then backs it with one number.** Readers care about "no waiting, no gaps, page stays put"; each bullet leads with that and keeps any figure to the one that proves it.
- **No competitor is named.** Chrome's spam policy and Edge's policy 1.1.2 don't allow other products' names in a listing. Every contrast is a general one that the competitor research (2026-10-09, current code of the WEBTOON loaders on the Chrome Web Store, AMO, Edge and Greasy Fork) backs:
  - "the way some loaders do": two of them scroll the page to the bottom and back to force loading; reviews of one mention a 2–3 s wait before reading.
  - "Nothing to set up … no switches to turn on per site": the generic lazy-load tools are off until configured per site, or don't recognise WEBTOON's images at all.
  - "Most loaders only work on the desktop site": all seven relevant ones match only `www.webtoons.com`.
  - "no access to other websites": the generic tools ask for every website.
  - "each one once": one userscript adds a cache-busting parameter, so panels download again on every visit.
  - "tells you instead of leaving you guessing": none of them shows progress or failures.
  - No competitor showed ads or tracking either, so "no ads, no tracking" is stated as a fact, not as a difference.
- **No browser is named** (Edge policy 1.1.2: a listing must not reference other browsers), so one text serves all three stores.
- **WEBTOON appears four times in the description:** Chrome treats a keyword repeated five or more times as keyword stuffing.
- **The numbers are measured** on Tower of God S3 Ep. 100 (124 panels; the mobile site shows 62), 2026-10-08/09, in Chrome 155, Edge 155 and Firefox 157, confirmed on a real Pixel 9a:
  - Fast connection: with the extension all 124 panels were downloaded while the page was still loading; without it, 2 of 124 had their image 12 s after opening.
  - Slow link (a local proxy capped at 9 Mbit/s, so the servers' own priorities apply), reading one screen per second: computer, 3 screens with a blank panel without, 0 with; phone (Pixel 9a profile), 11 blank panels without, 5 with.
  - Fast flick (a screen every 0.3 s, Chrome's Fast 4G profile), computer: 21 screens with a blank panel without, 0 with.
  - Size: 10.5 MB on a computer; on the phone 3.3 MB (high-density screen) or 1.9 MB (1× screen), each image requested once.
  - The test tools are in the local `.claude/tools/` (`blank-scroll.mjs`, `slow-proxy.mjs`, `m-test.mjs`, `bytes.mjs`). Re-measure before changing a number.

**Images** (build output, not committed; `dist/store/`, all 24-bit RGB PNG except the Edge logo):

- `1-compare.png`, `2-speed.png`, `3-loading.png`, `4-mobile.png`, `5-done.png`: 1280 × 800 screenshots, in this order (Chrome shows at most five and leads with the first). 1 and 2 are charts of the measured results (2 uses one shared scale; its colours pass the colour-blind checks); 3 and 5 are real reader screenshots taken at 2× and downscaled, with the bubble magnified from the 2× pixels; 4 is a real phone screenshot of the mobile reader, cropped above the site's own app banner.
- `promo-tile-440x280.png`: the small promo tile (Chrome requires it; Edge optional).
- `promo-large-1400x560.png`: Chrome's marquee / Edge's large promo tile (both optional, used only if the store features the item).
- Store icon: `extension/icons/icon-128.png` (Chrome, AMO); Edge wants `store-logo-300.png` (300 × 300).

The README's smaller copies (`compare.jpg`, `speed.jpg`, `mobile.jpg`) are committed in `docs/screenshots/`; the store-size images are build output and stay out of git.

To redraw: `python -I tools/make-icons.py` (icons and the 300 px logo). The screenshots and tiles come from the local `.claude/tools/` scripts: `shots.mjs` and `shot-mobile.mjs` take the raw reader screenshots in Chrome with the extension and Toonlight loaded (images held back by the script so the bubble shows "Preloading 52 / 124…"), and `store-images.py` draws the comparison, the callouts and the promo tiles from them.

Captions, where a store asks:

1. The whole chapter, before you scroll
2. Fewer blank panels while you read, on a computer and on a phone
3. Downloads start as the chapter opens; a small bubble shows the progress
4. On the mobile site too, each image downloaded once, in the size your screen needs
5. Jump anywhere: the panels are already there (shown with the Toonlight dark theme)

**URLs:**

- Homepage: https://github.com/hervad/webtoons-chapter-preloader
- Support: https://github.com/hervad/webtoons-chapter-preloader/issues
- Privacy policy: https://github.com/hervad/webtoons-chapter-preloader/blob/main/PRIVACY.md

**License:** MIT.

## Chrome Web Store

The developer account is already set up (Toonlight). **Check first:** since August 2026 each publisher gets two extension slots by default; Toonlight uses one. If **Add new item** is unavailable, request another slot in the dashboard.

1. **Add new item** → upload `toonlight-preloader-<version>-chrome.zip`.
2. **Store listing:**
   - Description: the text above.
   - Category: Entertainment (the closest to "reading comics"; Functionality & UI is the alternative). Language: English.
   - Store icon, the five screenshots and the small promo tile; no promo video.
   - Official URL: None. Homepage and support URLs as above.
   - Mature content: off. Item support: off (GitHub issues).
3. **Privacy:**
   - Single purpose:

     ```text
     Speeds up reading on WEBTOON's chapter reader (www.webtoons.com/*/viewer* and the mobile site's m.webtoons.com/*/viewer*) by downloading all of the open chapter's images when the chapter opens, instead of one by one as the user scrolls.
     ```

   - Permissions: the manifest asks for none, so there's no permission box to fill in.
   - Host permission justification (the dashboard may ask, because the content script's match counts as host access):

     ```text
     The extension's only function is to start downloading the open chapter's images as soon as a WEBTOON chapter page opens, so its content script must run on WEBTOON chapter pages (https://www.webtoons.com/*/viewer* and https://m.webtoons.com/*/viewer*). It runs on no other page or site, makes no network requests of its own and stores nothing.
     ```

   - Remote code: **No** (check it; the form can come up with Yes selected).
   - Data usage: tick none of the data types; tick all three certifications.
   - Privacy policy URL: as above (not strictly required when no data is handled, but it answers the question before a reviewer asks).
4. **Distribution:** free, public, all regions.
5. **Submit for review** with "publish automatically after it has passed review" ticked. A narrow, single-site match is not one of the in-depth review triggers; expect a few days.

## Microsoft Edge Add-ons

The partner account is already set up (Toonlight).

1. **Create new extension** → **Packages:** upload the same `toonlight-preloader-<version>-chrome.zip`.
2. **Availability:** Public, all markets, future markets ticked.
3. **Properties:** category Entertainment; website and support URLs as above; mature content unticked.
4. **Privacy:** the same single-purpose text as Chrome; no permissions to justify; remote code No; no data types; privacy policy URL; all three certifications.
5. **Store listings → English (United States) → Edit details:** description, `store-logo-300.png`, both promo tiles, the five screenshots with captions, and search terms.
   - **Search terms**, one per **Add Term** (a pasted comma list fails): `webtoons`, `webtoon reader`, `preload`, `comics`, `manhwa`, `lazy loading`, `fast loading`. At most 7, 30 characters each, 21 words in total; no other products' names.
   - **Save draft**, **Close**, reload: the row must say Complete before Publish works.
6. **Publish:** answer **Yes** to "Does a tester need … other info", then the notes:

   ```text
   No account or setup needed. Open any chapter on https://www.webtoons.com, for example https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-100/viewer?title_no=95&episode_no=517 (124 images).

   How to test:
   - With the browser's network panel open, every chapter image starts downloading while the page is still loading (without the extension, only the first couple load until you scroll).
   - A small bubble in the bottom-right corner shows "Preloading N / 124…", then "✓ Preloaded 124 images", and fades out.
   - Scroll quickly to the end: no blank panels.

   The extension only runs on WEBTOON chapter pages (www.webtoons.com and m.webtoons.com, /*/viewer*). It asks for no permissions, collects no data, stores nothing, loads no remote code and makes no network requests of its own; the images are the page's own, from WEBTOON's image server. Source code: https://github.com/hervad/webtoons-chapter-preloader
   ```

7. Review takes up to 7 business days.

## Firefox (addons.mozilla.org)

1. https://addons.mozilla.org/developers/ → **Submit a New Add-on** → **On this site** → upload `toonlight-preloader-<version>-firefox.zip`. It validates with no errors or warnings (`web-ext lint` is clean).
   - Compatibility: Firefox, and Firefox for Android ticked and greyed out. The manifest's `gecko_android` sets it; phones are sent to the mobile reader (`m.webtoons.com`), which the preloader supports.
   - The add-on ID is `toonlight-preloader@hervad` and can never change after the first upload.
2. **Do you need to submit source code?** **No.** The package's JavaScript is `webtoons-preloader.user.js` exactly as it is on GitHub; no tool generated, minified or bundled it.
3. **Describe add-on:**
   - Summary and description: the text above. Add-on URL: the default slug is fine.
   - Not experimental; doesn't require payment.
   - Categories: Games & Entertainment, and Photos, Music & Videos (AMO allows two).
   - Support website: the issues URL. License: MIT.
   - **This add-on has a Privacy Policy:** leave it unticked. AMO wants a policy only when data leaves the device, and the manifest declares `data_collection_permissions: required: none`.
   - **Notes to Reviewer:**

     ```text
     The only script, webtoons-preloader.user.js, is the userscript published at https://github.com/hervad/webtoons-chapter-preloader, copied byte for byte (its // ==UserScript== header is a comment). Nothing is minified, bundled, transpiled or generated; tools/build-extension.mjs in the repository only writes manifest.json and copies the files. sha256sum of the packaged file matches the file in the repository at the release tag.

     To test: open https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-100/viewer?title_no=95&episode_no=517 with the network panel open; all 124 chapter images start downloading while the page is still loading, and a bubble in the bottom-right corner ends on "✓ Preloaded 124 images". On Firefox for Android the same link opens the mobile reader (m.webtoons.com), which shows 62 of the panels; the bubble ends on "✓ Preloaded 62 images".
     ```

4. **Submit Version.** Publication usually takes up to 24 hours.
5. **Manage Listing → Edit Product Page → Images:** the icon and the five screenshots with captions.

## Each new version

1. Bump `@version` in the userscript (the extension takes it from there), update `CHANGELOG.md`, commit.
2. `node tools/build-extension.mjs`.
3. Test the build: load `dist/chrome/` in Chrome and Edge, `dist/firefox/` in Firefox, open a long chapter on the desktop site and on the mobile site (phone emulation), and check the bubble ends on "✓ Preloaded N images" with each image requested once (the local `.claude/tools/` harnesses do all of this).
4. Upload the new zips:
   - Chrome Web Store: the item → **Package** → Upload new package → Submit for review.
   - Edge: the extension → **Update** → Packages → Replace; certification notes are required again.
   - AMO: the add-on → **Upload New Version**; source code: No; reuse the reviewer notes.
