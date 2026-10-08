// Builds the browser extension (Toonlight Preloader) from the userscript.
// The preloader ships as webtoons-preloader.user.js (no build step); this
// packages the same file for the extension stores.
//
//   node tools/build-extension.mjs
//
// Output (dist/, not committed):
//   chrome/   unpacked, for Chrome and Edge (chrome://extensions → Load unpacked)
//   firefox/  unpacked, for Firefox (about:debugging → Load Temporary Add-on)
//   <slug>-<version>-chrome.zip   upload to the Chrome Web Store and Edge Add-ons
//   <slug>-<version>-firefox.zip  upload to addons.mozilla.org
//
// The userscript is the content script, copied byte for byte: it uses
// @grant none, so it needs no userscript API, and its header is only a
// comment. Store reviewers can diff the packaged file against GitHub. The
// extension's version is the userscript's @version.
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, crc32 } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = 'webtoons-preloader.user.js';
const NAME = 'Toonlight Preloader for WEBTOON';
const SLUG = 'toonlight-preloader';
// Chrome allows 132 characters.
const DESCRIPTION = 'Loads the whole WEBTOON chapter as it opens, so panels are never blank while you scroll. Not affiliated with NAVER WEBTOON.';
// Fixed for good once the add-on is on AMO: Firefox identifies it by this ID.
const GECKO_ID = 'toonlight-preloader@hervad';

if (NAME.length > 45) throw new Error(`name is ${NAME.length} characters; Firefox allows 45`);
if (DESCRIPTION.length > 132) throw new Error(`description is ${DESCRIPTION.length} characters; Chrome allows 132`);
const userscript = readFileSync(join(ROOT, SCRIPT));
const version = (userscript.toString('utf8').match(/^\/\/ @version\s+(\S+)/m) || [])[1];
if (!version) throw new Error('no @version in the userscript');

const base = {
    manifest_version: 3,
    name: NAME,
    version,
    description: DESCRIPTION,
    homepage_url: 'https://github.com/hervad/webtoons-chapter-preloader',
    icons: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' },
    // No permissions and no popup: the content script's matches are the only
    // access the extension has, the same as the userscript's @match lines.
    content_scripts: [{
        matches: ['https://www.webtoons.com/*/viewer*', 'https://m.webtoons.com/*/viewer*'],
        js: [SCRIPT],
        run_at: 'document_start',
    }],
};
const targets = {
    chrome: base,
    // Firefox: an add-on ID is required for MV3 signing, and AMO requires a
    // data-collection declaration (Firefox 140 desktop, 142 Android).
    // gecko_android makes AMO list it for Firefox for Android, where phones
    // get the mobile reader (m.webtoons.com).
    firefox: {
        ...base,
        browser_specific_settings: {
            gecko: { id: GECKO_ID, strict_min_version: '142.0', data_collection_permissions: { required: ['none'] } },
            gecko_android: { strict_min_version: '142.0' },
        },
    },
};

const SRC = join(ROOT, 'extension');
const DIST = join(ROOT, 'dist');
// Clear only this script's own output: dist/store/ (the store images) stays.
mkdirSync(DIST, { recursive: true });
for (const f of readdirSync(DIST)) {
    if (f === 'chrome' || f === 'firefox' || f.endsWith('.zip')) rmSync(join(DIST, f), { recursive: true, force: true });
}

function zip(files, out) {
    // A plain zip writer (deflate), so the build needs no npm packages.
    const local = [], central = [];
    let offset = 0;
    for (const [name, data] of files) {
        const nameBuf = Buffer.from(name, 'utf8');
        const deflated = deflateRawSync(data, { level: 9 });
        const crc = crc32(data);
        const head = Buffer.alloc(30);
        head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6);
        head.writeUInt16LE(8, 8); head.writeUInt32LE(0, 10); head.writeUInt32LE(crc, 14);
        head.writeUInt32LE(deflated.length, 18); head.writeUInt32LE(data.length, 22);
        head.writeUInt16LE(nameBuf.length, 26); head.writeUInt16LE(0, 28);
        local.push(head, nameBuf, deflated);
        const cen = Buffer.alloc(46);
        cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6);
        cen.writeUInt16LE(0x0800, 8); cen.writeUInt16LE(8, 10); cen.writeUInt32LE(0, 12);
        cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(deflated.length, 20); cen.writeUInt32LE(data.length, 24);
        cen.writeUInt16LE(nameBuf.length, 28); cen.writeUInt32LE(offset, 42);
        central.push(cen, nameBuf);
        offset += head.length + nameBuf.length + deflated.length;
    }
    const cenBuf = Buffer.concat(central);
    const endRec = Buffer.alloc(22);
    endRec.writeUInt32LE(0x06054b50, 0); endRec.writeUInt16LE(files.length, 8); endRec.writeUInt16LE(files.length, 10);
    endRec.writeUInt32LE(cenBuf.length, 12); endRec.writeUInt32LE(offset, 16);
    writeFileSync(out, Buffer.concat([...local, cenBuf, endRec]));
}

for (const [target, manifest] of Object.entries(targets)) {
    const dir = join(DIST, target);
    mkdirSync(join(dir, 'icons'), { recursive: true });
    const files = [];
    const add = (name, data) => { writeFileSync(join(dir, name), data); files.push([name, Buffer.from(data)]); };
    add('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
    add(SCRIPT, userscript);
    for (const f of readdirSync(join(SRC, 'icons'))) {
        copyFileSync(join(SRC, 'icons', f), join(dir, 'icons', f));
        files.push([`icons/${f}`, readFileSync(join(SRC, 'icons', f))]);
    }
    zip(files, join(DIST, `${SLUG}-${version}-${target}.zip`));
    console.log(`${target}: dist/${target}/ and dist/${SLUG}-${version}-${target}.zip`);
}
