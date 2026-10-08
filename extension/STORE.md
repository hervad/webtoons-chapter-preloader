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

## Listing text (all stores)

**Name:** Toonlight Preloader for WEBTOON (Firefox allows 45 characters, Chrome 75; the build checks it.)

**Short description / summary** (Chrome allows 132 characters and takes it from the manifest; AMO allows 250):
> Loads the whole WEBTOON chapter as it opens, so panels are never blank while you scroll. Not affiliated with NAVER WEBTOON.

**Description** (paste only the text. AMO accepts Markdown, so `-` bullets work there; Edge needs at least 250 characters):
> Toonlight Preloader downloads every panel of a WEBTOON chapter the moment you open it, so you can scroll as fast as you like and never wait for a blank panel to fill in.
>
> The site loads a chapter's images only as you scroll to them. On a long chapter or a slower connection, that means a blank flash every few panels. Toonlight Preloader starts all the downloads while the page is still opening: in a test on a 124-panel chapter, every panel had finished downloading before the page itself was done loading. Without it, 2 had.
>
> What makes it different:
> • Starts at once. Downloads begin while the page is still opening, not after it has loaded, and not one by one on a timer.
> • Never moves your page. Some loaders scroll the page to the bottom and back to make it load; Toonlight Preloader asks for the images directly, so the page stays exactly where you are.
> • Top of the chapter first. The first panels get priority, so you can start reading right away while the rest arrive.
> • Ready to show, not just downloaded. Panels a few screens ahead of you are prepared in advance, so even a fast scroll doesn't flash blank. It works a few panels at a time, so memory use stays low.
> • Works on your phone too. On the mobile site it loads every panel the page shows, at the image size your screen needs, and nothing more.
> • Tells you what's happening. A small bubble shows the progress and fades out on its own. If an image fails, it says how many instead of waiting forever.
> • Minimal access. It runs only on the chapter reader and asks for no other permission: no storage, no data collection, no requests of its own, no remote code.
> • Open source (MIT): the same code as the Webtoons Chapter Preloader userscript, published on GitHub.
>
> Pairs with Toonlight, the dark theme by the same developer; the two are tested together.
>
> Good to know: the whole chapter is downloaded when you open it, usually 10–20 MB on a computer and a few MB on a phone. On a metered connection you can turn the extension off from your browser's extensions menu.
>
> Toonlight Preloader is an independent project and is not affiliated with, endorsed by or sponsored by NAVER WEBTOON. WEBTOON is a trademark of NAVER WEBTOON.
>
> Source code and changelog: https://github.com/hervad/webtoons-chapter-preloader

Why the description reads this way:

- **No competitor is named.** Chrome's spam policy and Edge's policy 1.1.2 don't allow other products' names in a listing, so the copy contrasts *approaches* that are true of this extension (no scrolling, no delay, minimal access) rather than naming any product.
- **No browser is named** (Edge policy 1.1.2: a listing must not reference other browsers), so one text serves all three stores.
- **WEBTOON appears four times in the description:** Chrome treats a keyword repeated five or more times as keyword stuffing.
- **The numbers are measured**, not estimated: Tower of God S3 Ep. 100 (124 images) in Chrome 155, Edge 155 and Firefox 157 on 2026-10-08. With the extension, all 124 images were downloaded while the page was still loading. Without it, 2 of 124 had their real image 12 s after opening (no scrolling). Mobile site (emulated Pixel 5 and a 1× phone, in the same browsers): the page shows 62 of the 124 panels; with the extension all 62 load, each requested once in the size the screen needs (3.3 MB / 1.9 MB); without it, 4 had loaded. Re-measure before changing them.

**Images** (build output, not committed; `dist/store/`, all 24-bit RGB PNG except the Edge logo):

- `1-compare.png`, `2-loading.png`, `3-done.png`, `4-mobile.png`: 1280 × 800 screenshots (4 is a real phone screenshot of the mobile reader, cropped above the site's own app banner).
- `promo-tile-440x280.png`: the small promo tile (Chrome requires it; Edge optional).
- `promo-large-1400x560.png`: Chrome's marquee / Edge's large promo tile (both optional, used only if the store features the item).
- Store icon: `extension/icons/icon-128.png` (Chrome, AMO); Edge wants `store-logo-300.png` (300 × 300).

To redraw: `python -I tools/make-icons.py` (icons and the 300 px logo). The screenshots and tiles come from the local `.claude/tools/` scripts: `shots.mjs` and `shot-mobile.mjs` take the raw reader screenshots in Chrome with the extension and Toonlight loaded (images held back by the script so the bubble shows "Preloading 52 / 124…"), and `store-images.py` draws the comparison, the callouts and the promo tiles from them.

Captions, where a store asks:

1. The whole chapter, before you scroll
2. Downloads start as the chapter opens; a small bubble shows the progress
3. Jump anywhere: the panels are already there (shown with the Toonlight dark theme)
4. On the mobile site too, each image downloaded once, in the size your screen needs

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
   - Store icon, the four screenshots and the small promo tile; no promo video.
   - Official URL: None. Homepage and support URLs as above.
   - Mature content: off. Item support: off (GitHub issues).
3. **Privacy:**
   - Single purpose: "Speeds up reading on WEBTOON's chapter reader (www.webtoons.com/*/viewer* and the mobile site's m.webtoons.com/*/viewer*) by downloading all of the open chapter's images when the chapter opens, instead of one by one as the user scrolls."
   - Permissions: the manifest asks for none, so there's no permission box to fill in.
   - Host permission justification (the dashboard may ask, because the content script's match counts as host access): "The extension's only function is to start downloading the open chapter's images as soon as a WEBTOON chapter page opens, so its content script must run on WEBTOON chapter pages (https://www.webtoons.com/*/viewer* and https://m.webtoons.com/*/viewer*). It runs on no other page or site, makes no network requests of its own and stores nothing."
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
5. **Store listings → English (United States) → Edit details:** description, `store-logo-300.png`, both promo tiles, the four screenshots with captions, and search terms.
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
5. **Manage Listing → Edit Product Page → Images:** the icon and the four screenshots with captions.

## Each new version

1. Bump `@version` in the userscript (the extension takes it from there), update `CHANGELOG.md`, commit.
2. `node tools/build-extension.mjs`.
3. Test the build: load `dist/chrome/` in Chrome and Edge, `dist/firefox/` in Firefox, open a long chapter on the desktop site and on the mobile site (phone emulation), and check the bubble ends on "✓ Preloaded N images" with each image requested once (the local `.claude/tools/` harnesses do all of this).
4. Upload the new zips:
   - Chrome Web Store: the item → **Package** → Upload new package → Submit for review.
   - Edge: the extension → **Update** → Packages → Replace; certification notes are required again.
   - AMO: the add-on → **Upload New Version**; source code: No; reuse the reviewer notes.
