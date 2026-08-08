/**
 * The header's three control glyphs, drawn for this brand.
 *
 * Lucide covers the whole admin, but the header's toggles sit on the hero —
 * three 34px gold-hairline circles that are the only interface on the page —
 * and its stock `Moon` / `Sun` / `ShoppingBag` read as a settings screen there.
 * These are drawn on the same 24 grid at the same 1.6 stroke so they mix with
 * lucide everywhere else, with the details a brand mark can afford: the moon
 * carries the night sky with it, the sun keeps a heavier core than its rays,
 * and the bag is stamped with a coffee bean instead of being a generic tote.
 *
 * All three inherit `currentColor` and take their size from the caller.
 */

interface IconProps {
  size?: number;
  className?: string;
}

function frame(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

/** Crescent + two stars — the "switch to dark" glyph. */
export function MoonIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      {/*
        The crescent is ONE closed path: an outer arc sweeping the full disc and
        an inner arc cutting the bite out of it. Drawn slightly off-centre and
        tilted so it reads as a waning moon rather than as a letter C.
      */}
      <path d="M20.4 14.6A8.4 8.4 0 0 1 9.4 3.6a8.6 8.6 0 1 0 11 11Z" />
      {/* two stars, unequal on purpose — a matched pair reads as a decoration,
          an uneven one reads as a sky */}
      <path d="M17.1 3.1 17.7 4.9 19.5 5.5 17.7 6.1 17.1 7.9 16.5 6.1 14.7 5.5 16.5 4.9Z" />
      <circle cx="20.9" cy="9.1" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Sun with a filled core and eight rays — the "switch to light" glyph. */
export function SunIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      {/* filled, not outlined: at 17px an outlined 4.2r circle closes up into a
          smudge, and the solid disc is what keeps the rays legible */}
      <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
      {/* the four diagonals are shorter than the four axials, which is what
          stops the star from looking square */}
      <path d="M12 1.8v2.4M12 19.8v2.4M1.8 12h2.4M19.8 12h2.4" />
      <path d="M5.1 5.1 6.7 6.7M17.3 17.3 18.9 18.9M18.9 5.1 17.3 6.7M6.7 17.3 5.1 18.9" />
    </svg>
  );
}

/** Shopping bag stamped with a coffee bean — the cart. */
export function CoffeeBagIcon({ size = 17, className }: IconProps) {
  return (
    <svg {...frame(size)} className={className}>
      {/* the body tapers towards the base — straight sides read as a briefcase */}
      <path d="M4.5 8.8h15l-1.1 10.2a2.5 2.5 0 0 1-2.5 2.3H8.1a2.5 2.5 0 0 1-2.5-2.3Z" />
      {/*
        The handle passes THROUGH the rim and stops inside the bag, which is
        the whole difference between a tote and a padlock: an arch that lands
        on the rim closes the outline into a shackle-over-a-body, and at 17px
        that is what the eye names first. These two stubs keep it open.
      */}
      <path d="M8.6 11.4V6.8a3.4 3.4 0 0 1 6.8 0v4.6" />
      {/* the bean, tilted off the vertical so it is a bean and not an eye —
          the one mark that makes this Moriva's bag rather than any shop's */}
      <g transform="rotate(-22 12 16.5)">
        <ellipse cx="12" cy="16.5" rx="2.6" ry="3.2" />
        <path d="M12 13.8c-1.4 1.6 1.4 3.7 0 5.4" strokeWidth={1.15} />
      </g>
    </svg>
  );
}
