# Accessibility

The preloader changes when the comic's images load, not how the page looks or works, so the site's own keyboard, screen-reader and zoom behaviour is unchanged.

## What it does

- **No moving page:** it never scrolls the page or moves focus to make images load, so your reading position, keyboard focus and screen-reader cursor stay where you put them.
- **Comic panels untouched:** the images, their order and their alt text are exactly the site's own; only the moment they download changes.
- **The progress bubble** sits in the bottom-right corner (top-right below the header on the mobile site, clear of its bottom toolbar), ignores the mouse (clicks go through to the page), uses white text on a dark background (well above the WCAG AA 4.5:1 minimum) and fades out on its own after loading. It never covers anything you need to click.
- **Screen readers** hear only the final result ("Preloaded 124 images", or how many images failed), through a polite status message that doesn't interrupt. The running count ("Preloading 37 / 124…") isn't announced: it changes with every image and would talk over the page.

## Known limitations

- The bubble fades in and out with a short opacity transition, also with "reduce motion" on. It doesn't move or zoom.

## Reporting a barrier

If something is hard to read or use, please [open an issue](https://github.com/hervad/webtoons-chapter-preloader/issues/new/choose) with the chapter URL and what you use (browser, screen reader, system settings). Accessibility problems are treated as bugs.
