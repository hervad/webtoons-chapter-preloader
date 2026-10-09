// ==UserScript==
// @name         Webtoons Chapter Preloader
// @namespace    https://github.com/hervad/webtoons-chapter-preloader
// @version      1.3.1
// @description  Force-loads every image in a Webtoons chapter as the page opens instead of lazy-loading on scroll, and pre-decodes images just ahead of the reader so fast scrolling doesn't show blanks.
// @author       hervad
// @match        https://www.webtoons.com/*/viewer*
// @match        https://m.webtoons.com/*/viewer*
// @icon         https://www.webtoons.com/favicon.ico
// @run-at       document-start
// @grant        none
// @noframes
// @license      MIT
// @homepageURL  https://github.com/hervad/webtoons-chapter-preloader
// @supportURL   https://github.com/hervad/webtoons-chapter-preloader/issues
// @updateURL    https://raw.githubusercontent.com/hervad/webtoons-chapter-preloader/main/webtoons-preloader.user.js
// @downloadURL  https://raw.githubusercontent.com/hervad/webtoons-chapter-preloader/main/webtoons-preloader.user.js
// ==/UserScript==

(function () {
    'use strict';

    // One copy per page: the Toonlight Preloader extension runs this same
    // file. With both installed, each would decode and track the bubble, so
    // the first copy to claim the page runs it. The claim is an attribute on
    // the shared DOM, which the userscript and the extension both see.
    // A copy injected before <html> exists can't claim yet; it keeps going
    // and claims at DOMContentLoaded (finish), since copying data-url into
    // src twice is harmless: preloadImage skips an image that's already set.
    const TOKEN = Math.random().toString(36).slice(2);

    function claimPage() {
        const root = document.documentElement;
        if (!root) return true;
        const owner = root.getAttribute('data-wt-preloader');
        if (owner === null) root.setAttribute('data-wt-preloader', TOKEN);
        return owner === null || owner === TOKEN;
    }

    if (!claimPage()) return;

    const IMG_SELECTOR   = '#_imageList img';
    const M_IMG_SELECTOR = '.viewer_img img._checkVisible'; // m.webtoons.com reader
    const STATUS_ID      = '__wt_preloader_status'; // don't rename: Webtoons Dark Mode ignores the bubble by this ID
    const TIERS          = [1, 5]; // desktop: panel 1 alone, then the next 5 (the first screen), then the rest
    const TIER_WAIT_MS   = 1500;   // open the next tier after this long even if the current one hasn't arrived
    const DECODE_AHEAD   = '300%'; // pre-decode images within this many viewport heights below the screen
    const MOBILE_WAIT_MS = 15000;  // give up on m.webtoons.com if the viewer hasn't shown a panel by then

    /* ---------- core: start a download ---------- */

    function startDownload(img, src, srcset, high) {
        // Hints must be set before src: assigning src starts the request.
        img.loading = 'eager';                             // in case the site ever adds loading="lazy"
        img.decoding = 'async';                            // Chromium hint; Firefox ignores it
        if (high) img.fetchPriority = 'high';
        // srcset first, so the browser picks its candidate once instead of
        // starting on src and switching.
        if (srcset) img.srcset = srcset;
        img.src = src;
    }

    /* ---------- desktop: download in tiers ---------- */
    // On a chapter the image server hasn't cached, it answers each image after
    // a different delay (from 0.05 s to several seconds). Requested all at
    // once, the panels arrived in random order: panel 1 came anywhere from 1st
    // to 109th, so the reader saw a blank first panel while the bubble said
    // 90. Priority hints can't fix that, because the delay comes before the
    // server has anything to send. So panel 1 goes alone, then the rest of the
    // first screen, then everything else at once. A tier opens when the one
    // before it has arrived, or after TIER_WAIT_MS: one slow image must not
    // hold back the whole chapter.
    const seen = new WeakSet();
    const held = [];                       // [img, tier] waiting for their tier to open
    const inFlight = TIERS.map(() => 0);   // downloads per tier that haven't arrived yet
    let seenCount = 0, openTier = 0, tierTimer = 0;

    function tierOf(k) {
        let end = 0;
        for (let t = 0; t < TIERS.length; t++) {
            end += TIERS[t];
            if (k < end) return t;
        }
        return TIERS.length;
    }

    function openNextTier() {
        clearTimeout(tierTimer);
        openTier++;
        held.splice(0).forEach(([img, t]) => (t <= openTier ? fetchPanel(img, t) : held.push([img, t])));
        if (openTier < TIERS.length) tierTimer = setTimeout(openNextTier, TIER_WAIT_MS);
    }

    function fetchPanel(img, t) {
        const realUrl = img.dataset.url;
        if (!realUrl) return;                              // nothing to do
        if (img.getAttribute('src') === realUrl) return;   // already pointing at the real one
        if (t < TIERS.length) {
            inFlight[t]++;
            // The placeholder can still be loading when src changes, and its
            // load event fires afterwards: only the real panel counts.
            const arrived = e => {
                if (e && img.currentSrc !== realUrl) return;
                img.removeEventListener('load', arrived);
                img.removeEventListener('error', arrived);
                if (--inFlight[t] === 0 && t === openTier) openNextTier();
            };
            img.addEventListener('load', arrived);
            img.addEventListener('error', arrived);
        }
        // The first screen also goes ahead of the page's other images (ads, thumbnails).
        startDownload(img, realUrl, null, t < TIERS.length);
        if (decoder) decoder.observe(img);
    }

    // Desktop: the real URL is in the markup, in data-url.
    function preloadImage(img) {
        if (seen.has(img)) return;
        seen.add(img);
        const t = tierOf(seenCount++);
        if (seenCount === 1) tierTimer = setTimeout(openNextTier, TIER_WAIT_MS);
        if (t <= openTier) fetchPanel(img, t);
        else held.push([img, t]);
    }

    /* ---------- mobile site (m.webtoons.com) ---------- */
    // The mobile reader has no data-url: its viewer script builds the <img>s
    // from an inline `var imageList = [...]` and keeps each URL in jQuery's
    // private data, which a content script can't read. So the URLs are
    // rebuilt here from that inline list, the way the viewer builds them
    // (getImageType / getLowQualityImageType in webToAppScrollViewer):
    // ?type=q70 (q90 on iPad, q40 in Indonesia), plus a 500w / 700w srcset
    // for JPEGs. The rebuilt URLs must match what the viewer itself set on
    // the panels it has already shown, or nothing is touched: a mismatch
    // would download every image twice. Only the <img>s the page shows are
    // filled; mobile web shows part of some chapters and the rest in the app.

    function readMobileState() {
        for (const s of document.scripts) {
            const t = s.textContent;
            const at = t.indexOf('var imageList = [');
            if (at < 0) continue;
            const body = t.slice(at, t.indexOf('];', at));
            const list = [...body.matchAll(/url:\s*"([^"]+)"\s*,\s*spec:\s*"([^"]*)"\s*,\s*width:\s*(\d+)\s*,\s*height:\s*(\d+)/g)]
                .map(m => ({ url: m[1], spec: m[2], width: +m[3], height: +m[4] }));
            const country = (t.match(/countryCode:\s*"([A-Z]*)"/) || [])[1] || '';
            const placeholder = (t.match(/transparencyImageUrl:\s*'([^']+)'/) || [])[1];
            return list.length && placeholder ? { list, country, placeholder } : null;
        }
        return null;
    }

    function mobileUrls({ url, spec }, country) {
        const ipad = navigator.userAgent.toLowerCase().includes('ipad');
        const type = spec === 'JPG' ? (ipad ? 'q90' : country === 'ID' ? 'q40' : 'q70')
            : spec === 'PNG' ? 'opti' : spec === 'GIF' ? 'ani' : null;
        const low = spec === 'JPG' && !ipad ? (country === 'ID' ? 'q40s' : 'q70s') : null;
        const src = type ? `${url}?type=${type}` : url;
        return { src, srcset: low ? `${url}?type=${low} 500w, ${src} 700w` : null };
    }

    // Returns the chapter's <img>s once they're all loading, [] if this page
    // can't be preloaded, or null to try again after the next change.
    function preloadMobile() {
        const state = readMobileState();
        if (!state) return [];
        const imgs = [...document.querySelectorAll(M_IMG_SELECTOR)];
        if (!imgs.length) return null;                     // viewer not built yet
        if (imgs.length > state.list.length) return [];    // not the list we think it is
        const shown = imgs.filter(img => img.getAttribute('src') !== state.placeholder);
        if (!shown.length) return null;                    // nothing to compare with yet
        for (const img of shown) {
            const want = mobileUrls(state.list[imgs.indexOf(img)], state.country);
            if (img.getAttribute('src') !== want.src || img.getAttribute('srcset') !== want.srcset) {
                console.info('[webtoons-chapter-preloader] mobile image URLs changed; not preloading this page');
                return [];
            }
        }
        imgs.forEach((img, i) => {
            if (img.getAttribute('src') !== state.placeholder) return;
            // Same picture? The viewer sizes each <img> from the list's
            // width / height, so a shifted list shows up here.
            const { width, height } = state.list[i];
            if (Math.abs(img.getAttribute('height') - img.getAttribute('width') * height / width) > 2) return;
            const want = mobileUrls(state.list[i], state.country);
            startDownload(img, want.src, want.srcset, true);
        });
        return imgs.filter(img => img.getAttribute('src') !== state.placeholder);
    }

    /* ---------- pre-decode just ahead of the reader ---------- */
    // Firefox only decodes images within about one screen of the viewport, so on
    // a fast scroll an image that is already downloaded still shows blank while
    // it decodes. Decoding a few screens ahead hides that. Decoded copies cost
    // ~3.5 MB each, so this is a rolling window, never the whole chapter; the
    // browser drops ones that scroll out of use on its own.
    const decoder = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
        for (const e of entries) {
            if (e.isIntersecting) e.target.decode().catch(() => {}); // broken images reject
        }
    }, { rootMargin: `0px 0px ${DECODE_AHEAD} 0px` });

    /* ---------- tiny progress bubble ---------- */
    // The bubble is built complete before it's added, and its text changes
    // only through text nodes (characterData), never by adding or removing
    // children: Webtoons Dark Mode's observer watches childList and skips
    // records about the bubble element itself, so this keeps the bubble from
    // making it re-scan the page on every image.
    // Screen readers hear only the final result, from a visually hidden
    // status region; announcing every "Preloading 37 / 124…" would talk over
    // the reader.

    let shownText, spokenText;

    function ensureStatusEl() {
        let el = document.getElementById(STATUS_ID);
        if (el) return el;
        el = document.createElement('div');
        el.id = STATUS_ID;
        Object.assign(el.style, {
            position: 'fixed',
            // The mobile reader's bottom toolbar (episode strip, next-episode
            // arrows) fills the bottom-right corner; there the bubble goes
            // just below the 40 px header instead.
            ...(location.hostname === 'm.webtoons.com' ? { top: '52px' } : { bottom: '16px' }),
            right: '16px',
            zIndex: '2147483647',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.78)',
            color: '#fff',
            font: '12px/1.4 system-ui, -apple-system, sans-serif',
            borderRadius: '6px',
            pointerEvents: 'none',
            transition: 'opacity .3s',
            opacity: '0',
        });
        shownText = document.createTextNode('');
        const live = document.createElement('span');
        live.setAttribute('role', 'status');
        Object.assign(live.style, {
            position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
            clipPath: 'inset(50%)', whiteSpace: 'nowrap',
        });
        spokenText = document.createTextNode('');
        live.append(spokenText);
        el.append(shownText, live);
        document.body.appendChild(el);
        return el;
    }

    let fadeTimer;

    function showStatus(text, final = false) {
        clearTimeout(fadeTimer);
        const el = ensureStatusEl();
        shownText.data = text;
        if (final) spokenText.data = text.replace(/^[✓⚠]\s*/, '');
        el.style.opacity = '1';
    }

    function fadeStatus(delay = 1500) {
        const el = document.getElementById(STATUS_ID);
        if (!el) return;
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => { el.style.opacity = '0'; }, delay);
    }

    // pending(img): its download hasn't started yet (a held desktop panel still
    // shows its loaded placeholder, so img.complete alone would count it).
    function trackProgress(imgs, pending) {
        const update = () => {
            let settled = 0, failed = 0;
            for (const img of imgs) {
                if (!img.complete || pending(img)) continue;
                settled++;
                if (img.naturalWidth === 0) failed++; // complete but broken = error
            }

            if (settled < imgs.length) {
                showStatus(`Preloading ${settled} / ${imgs.length}…`);
                return;
            }

            // Done. Stop listening: the site's own lazy loader re-sets src on
            // visible images while scrolling, which fires load again and would
            // otherwise keep popping the bubble back up.
            for (const img of imgs) {
                img.removeEventListener('load',  update);
                img.removeEventListener('error', update);
            }
            if (failed) {
                showStatus(`⚠ Preloaded ${imgs.length - failed} / ${imgs.length} images (${failed} failed)`, true);
                fadeStatus(4000);
            } else {
                showStatus(`✓ Preloaded ${imgs.length} images`, true);
                fadeStatus();
            }
        };

        for (const img of imgs) {
            img.addEventListener('load',  update);
            img.addEventListener('error', update);
        }
        update();
    }

    // Held panels join the decoder when their download starts (fetchPanel),
    // so it doesn't decode their placeholder instead.
    function watch(imgs, pending = () => false) {
        if (decoder) imgs.forEach(img => { if (!pending(img)) decoder.observe(img); });
        trackProgress(imgs, pending);
    }

    /* ---------- entry points ---------- */

    // Runs once the HTML is fully parsed: catch anything the parse-time
    // observer missed (or everything, if the script started late), then
    // start pre-decoding and progress tracking on the complete image list.
    function finish() {
        if (!claimPage()) return;
        const imgs = [...document.querySelectorAll(IMG_SELECTOR)];
        if (!imgs.length) return;
        imgs.forEach(preloadImage);
        watch(imgs, img => img.getAttribute('src') !== img.dataset.url);
    }

    // Mobile: the viewer builds the <img>s after parsing and sets the first
    // panels' src itself, so wait for that, at most once a frame, then
    // preload the rest in one go.
    function finishMobile() {
        if (!claimPage()) return;
        let queued = false, done = false;
        const stop = () => { done = true; observer.disconnect(); clearTimeout(giveUp); };
        const attempt = () => {
            queued = false;
            if (done) return;
            const imgs = preloadMobile();
            if (imgs === null) return;
            stop();
            if (imgs.length) watch(imgs);
        };
        const observer = new MutationObserver(() => {
            if (!queued) { queued = true; requestAnimationFrame(attempt); }
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
        const giveUp = setTimeout(stop, MOBILE_WAIT_MS);
        attempt();
    }

    if (location.hostname === 'm.webtoons.com') {
        // The mobile page also starts ~650 episode-list thumbnails (about
        // 12 MB) as it opens, and the viewer requests its first panels at the
        // same normal priority, so which panels arrived first was luck: the
        // first screen came after panels further down. Marking every panel
        // high priority as the viewer creates it (before it sets src) puts
        // the viewer's own first screen first, then the preloaded rest, all
        // ahead of the thumbnails.
        const boost = new MutationObserver(records => {
            for (const r of records) {
                for (const node of r.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    if (node.matches(M_IMG_SELECTOR)) node.fetchPriority = 'high';
                    else node.querySelectorAll(M_IMG_SELECTOR).forEach(img => { img.fetchPriority = 'high'; });
                }
            }
        });
        boost.observe(document, { childList: true, subtree: true });
        setTimeout(() => boost.disconnect(), MOBILE_WAIT_MS);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', finishMobile, { once: true });
        } else {
            finishMobile();
        }
    } else if (document.readyState === 'loading') {
        // The image list sits in the middle of a ~1 MB page followed by
        // render-blocking scripts. Start each download as soon as the parser
        // creates its <img> instead of waiting for the rest of the page.
        const parser = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.tagName === 'IMG' && node.matches(IMG_SELECTOR)) preloadImage(node);
                }
            }
        });
        parser.observe(document, { childList: true, subtree: true });
        // Chapter changes are full page loads, so nothing needs watching after this.
        document.addEventListener('DOMContentLoaded', () => {
            parser.disconnect();
            finish();
        }, { once: true });
    } else {
        finish();
    }
})();
