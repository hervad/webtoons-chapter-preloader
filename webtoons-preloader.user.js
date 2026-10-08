// ==UserScript==
// @name         Webtoons Chapter Preloader
// @namespace    https://github.com/hervad/webtoons-chapter-preloader
// @version      1.1.0
// @description  Force-loads every image in a Webtoons chapter as the page opens instead of lazy-loading on scroll, and pre-decodes images just ahead of the reader so fast scrolling doesn't show blanks.
// @author       hervad
// @match        https://www.webtoons.com/*/viewer*
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

    const IMG_SELECTOR  = '#_imageList img';
    const STATUS_ID     = '__wt_preloader_status'; // don't rename: Webtoons Dark Mode ignores the bubble by this ID
    const HIGH_PRIORITY = 3;      // first N images (top of chapter) fetched ahead of the rest
    const DECODE_AHEAD  = '300%'; // pre-decode images within this many viewport heights below the screen

    /* ---------- core: copy data-url -> src ---------- */

    let started = 0; // downloads started so far, in document order

    function preloadImage(img) {
        const realUrl = img.dataset.url;
        if (!realUrl) return;                              // nothing to do
        if (img.getAttribute('src') === realUrl) return;   // already pointing at the real one
        // Hints must be set before src: assigning src starts the request.
        img.loading = 'eager';                             // in case the site ever adds loading="lazy"
        img.decoding = 'async';                            // Chromium hint; Firefox ignores it
        if (started++ < HIGH_PRIORITY) img.fetchPriority = 'high';
        img.src = realUrl;
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

    function ensureStatusEl() {
        let el = document.getElementById(STATUS_ID);
        if (el) return el;
        el = document.createElement('div');
        el.id = STATUS_ID;
        Object.assign(el.style, {
            position: 'fixed',
            bottom: '16px',
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
        document.body.appendChild(el);
        return el;
    }

    let fadeTimer;

    function showStatus(text) {
        clearTimeout(fadeTimer);
        const el = ensureStatusEl();
        el.textContent = text;
        el.style.opacity = '1';
    }

    function fadeStatus(delay = 1500) {
        const el = document.getElementById(STATUS_ID);
        if (!el) return;
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => { el.style.opacity = '0'; }, delay);
    }

    function trackProgress(imgs) {
        const update = () => {
            let settled = 0, failed = 0;
            for (const img of imgs) {
                if (!img.complete) continue;
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
                showStatus(`⚠ Preloaded ${imgs.length - failed} / ${imgs.length} images (${failed} failed)`);
                fadeStatus(4000);
            } else {
                showStatus(`✓ Preloaded ${imgs.length} images`);
                fadeStatus();
            }
        };

        for (const img of imgs) {
            img.addEventListener('load',  update);
            img.addEventListener('error', update);
        }
        update();
    }

    /* ---------- entry points ---------- */

    // Runs once the HTML is fully parsed: catch anything the parse-time
    // observer missed (or everything, if the script started late), then
    // start pre-decoding and progress tracking on the complete image list.
    function finish() {
        const imgs = [...document.querySelectorAll(IMG_SELECTOR)];
        if (!imgs.length) return;
        imgs.forEach(preloadImage);
        if (decoder) imgs.forEach(img => decoder.observe(img));
        trackProgress(imgs);
    }

    if (document.readyState === 'loading') {
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
