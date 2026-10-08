"""Draws the extension icons (extension/icons/icon-{16,32,48,128}.png) and
Edge's 300 px store logo (dist/store/store-logo-300.png): a strip of three
comic panels on Toonlight's dark card, the top two filled green (loaded) and
the last one an outline (coming up), so it reads as "the chapter is already
there". Drawn at 512 px and scaled down, so the small sizes stay crisp.

Usage: python -I tools/make-icons.py   (needs Pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw

S = 512
GREEN = (0, 213, 100, 255)      # Toonlight's accent
OUTLINE = (151, 158, 168, 255)  # Toonlight popup's --mute grey

out = Path(__file__).resolve().parent.parent / 'extension' / 'icons'
out.mkdir(parents=True, exist_ok=True)

img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# Card: Toonlight's --wt-bg-elev with a faint lighter top edge, so the two
# extensions sit together in the toolbar.
d.rounded_rectangle((0, 0, S - 1, S - 1), radius=112, fill=(34, 38, 43, 255))
d.rounded_rectangle((6, 6, S - 7, S - 7), radius=106, outline=(255, 255, 255, 22), width=6)

# Three panels, a tall webtoon-style strip; the gaps are wide enough to
# survive the 16 px downscale (about 1 px each there).
x0, x1 = 144, 368
panels = [(84, 196), (228, 340), (372, 428)]
for i, (y0, y1) in enumerate(panels):
    if i < 2:
        d.rounded_rectangle((x0, y0, x1, y1), radius=26, fill=GREEN)
    else:
        d.rounded_rectangle((x0, y0, x1, y1), radius=26, outline=OUTLINE, width=22)

for size in (16, 32, 48, 128):
    img.resize((size, size), Image.Resampling.LANCZOS).save(out / f'icon-{size}.png')
print('icons written to', out)

# Edge Add-ons wants a 300 x 300 store logo; it's a store image, not part of
# the package, so it goes with the other store images in dist/store/.
store = out.parent.parent / 'dist' / 'store'
store.mkdir(parents=True, exist_ok=True)
img.resize((300, 300), Image.Resampling.LANCZOS).save(store / 'store-logo-300.png')
print('store logo written to', store / 'store-logo-300.png')
