# Phone preview — TEMPORARY

A recording rig. It puts the live site inside a phone frame on a desktop
screen, at the device's real CSS viewport size, so the mobile experience can be
screen-recorded without filming a phone.

**This is not a product feature. Delete it before the client sees the site** —
a "Phone preview" button in the header of a live store is exactly the sort of
thing that makes a finished site look unfinished.

## Using it

Click the phone icon in the header (right-hand chip group, next to the menu
button). Then:

- **Device buttons** — iPhone 15 Pro (393×852), iPhone 13 Pro (390×844),
  iPhone 13 mini (375×812), iPhone SE (375×667), Pixel 8 Pro (412×915),
  Galaxy A54 / Redmi Note (360×800). Each reserves the status bar its own OS
  reserves, so the site is filmed with the viewport height it really gets:
  54 px under an island, 47 under a notch, 40 under a punch-hole, 22 on the SE.
  The A54 is the narrowest frame and the one most real orders come from; the
  13 mini is the short modern iPhone.
- **Rotate** — landscape.
- **Fullscreen** — the phone is sized to fill whatever box it is given, so
  this is simply the biggest and sharpest it gets: worth ~15 % on a 1080p
  screen, and it keeps the tab strip and address bar out of a window capture.
  Esc leaves fullscreen without also leaving the preview.
- **✕ / Esc** — back to the desktop site.

The controls fade out after ~2.5 idle seconds and return on the first mouse
move, so a recording longer than that catches only the phone. The mode is kept
in `sessionStorage`, so reloading the page — which is how you re-trigger the
splash screen — keeps you in the preview.

Because it is a real iframe and not a scaled-down `<div>`, everything that asks
the window a question gets the phone's answer: `@media (max-width: 767px)`,
`100vh`, `position: fixed`, and `useMediaFlags()`. What you record is the
mobile site, not a small picture of the desktop one.

## Removing it

Three steps, no side effects:

1. Delete this folder (`src/devtools/phone-preview/`). If it leaves
   `src/devtools/` empty, delete that too.
2. `src/App.tsx` — remove the `PhonePreview` import and unwrap the
   `<PhonePreview>` element around `<BrowserRouter>` (re-indent).
3. `src/components/layout/Header.tsx` — remove the `PhonePreviewButton` import
   and the `<PhonePreviewButton />` line.

Every one of those insertion points is tagged `PHONE PREVIEW`, so:

```
grep -rn "PHONE PREVIEW" src/
```

finds all of them. Then `bun run typecheck && bun run lint` to confirm nothing
else referenced it — nothing else does. Nothing in `src/` outside this folder
imports from it, and it adds no dependency that was not already installed.
