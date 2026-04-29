// ==UserScript==
// @name         Webtoons Chapter Preloader
// @namespace    https://github.com/hervad/webtoons-chapter-preloader
// @version      1.0.0
// @description  Force-loads every image in a Webtoons chapter on page open instead of lazy-loading on scroll. Handles SPA navigation between chapters.
// @author       hervad
// @match        https://www.webtoons.com/*/viewer*
// @icon         https://www.webtoons.com/favicon.ico
// @run-at       document-idle
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

    const IMG_SELECTOR = '#_imageList img';
    const STATUS_ID    = '__wt_preloader_status';

    /* ---------- core: copy data-url -> src ---------- */

    function preloadImage(img) {
        const realUrl = img.dataset.url;
        if (!realUrl) return false;          // nothing to do
        if (img.src === realUrl) return false; // already pointing at the real one
        img.src = realUrl;
        img.loading = 'eager';
        img.decoding = 'async';
        return true;
    }

    function preloadAll() {
        const imgs = document.querySelectorAll(IMG_SELECTOR);
        let started = 0;
        imgs.forEach(img => { if (preloadImage(img)) started++; });
        return { total: imgs.length, started };
    }

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

    function showStatus(text) {
        const el = ensureStatusEl();
        el.textContent = text;
        el.style.opacity = '1';
    }

    function fadeStatus(delay = 1500) {
        const el = document.getElementById(STATUS_ID);
        if (!el) return;
        setTimeout(() => { el.style.opacity = '0'; }, delay);
    }

    function trackProgress() {
        const imgs = [...document.querySelectorAll(IMG_SELECTOR)];
        if (!imgs.length) return;

        const update = () => {
            const loaded = imgs.filter(i => i.complete && i.naturalWidth > 0).length;
            if (loaded >= imgs.length) {
                showStatus(`✓ Preloaded ${imgs.length} images`);
                fadeStatus();
            } else {
                showStatus(`Preloading ${loaded} / ${imgs.length}…`);
            }
        };

        update();
        for (const img of imgs) {
            if (img.dataset.__wtTracked) continue;
            img.dataset.__wtTracked = '1';
            img.addEventListener('load',  update, { once: true });
            img.addEventListener('error', update, { once: true });
        }
    }

    /* ---------- entry points ---------- */

    function run() {
        const { total } = preloadAll();
        if (total > 0) trackProgress();
    }

    run();

    /* ---------- handle SPA chapter changes & late-inserted imgs ---------- */
    // Webtoons swaps the imageList in-place when navigating chapters. Filter
    // mutations to ones that actually add images so we don't rerun on every
    // unrelated DOM tick (comments, like counts, etc.).
    let pending;
    const scheduleRun = () => {
        clearTimeout(pending);
        pending = setTimeout(run, 100);
    };

    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (node.tagName === 'IMG' || node.querySelector?.('img')) {
                    scheduleRun();
                    return;
                }
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
