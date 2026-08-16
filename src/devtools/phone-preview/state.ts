import { create } from "zustand";

/**
 * TEMPORARY — recording rig. See ./README.md for how to delete it.
 *
 * The whole feature lives in this folder plus two one-line insertion points
 * (src/App.tsx and src/components/layout/Header.tsx), both marked
 * `PHONE PREVIEW`.
 */

/**
 * The `name` the outer window gives the iframe.
 *
 * How the app knows which side of the glass it is on. The alternative was a
 * `?phone=1` query flag, which react-router drops the moment you click a link
 * inside the frame — so the inner app would draw a second phone inside the
 * first one as soon as anyone navigated. `window.name` is set on the element
 * before its document exists and survives both navigation and reload.
 */
const FRAME_NAME = "norlyn-phone-preview-frame";

/** True only inside the previewed iframe: draw the site, not the rig. */
export const IN_PHONE_FRAME = typeof window !== "undefined" && window.name === FRAME_NAME;

export { FRAME_NAME };

/**
 * CSS viewport sizes, as the real devices report them. `short` is what the
 * side rail shows — the full name is the button's tooltip.
 *
 * `notch` says what the OS keeps for itself at the top, and each one reserves
 * a different depth (see PhoneStage): `island` a Dynamic Island, `notch` the
 * older iPhone cut-out — drawn hanging off the top edge rather than floating
 * below it, and a shallower strip than the island's — `punch` an Android
 * camera hole, `none` a phone with a real bezel and no cut-out at all.
 */
export const DEVICES = {
  "iphone-15-pro": {
    label: "iPhone 15 Pro",
    short: "15 Pro",
    width: 393,
    height: 852,
    radius: 55,
    notch: "island",
  },
  /*
    The last of the notched iPhones, and still the most common phone in the
    hands the ads are aimed at — a shot framed only on a 15 Pro is framed for
    54 px of reserved status bar that most viewers do not have.
  */
  "iphone-13-pro": {
    label: "iPhone 13 Pro",
    short: "13 Pro",
    width: 390,
    height: 844,
    radius: 47,
    notch: "notch",
  },
  /*
    The short modern iPhone. Worth having next to the 13 Pro because 32 px of
    lost height is exactly the margin that decides whether a hero fits above
    the fold — and the SE, the only shorter frame here, is too old a shape to
    stand in for it.
  */
  "iphone-13-mini": {
    label: "iPhone 13 mini",
    short: "13 mini",
    width: 375,
    height: 812,
    radius: 44,
    notch: "notch",
  },
  "iphone-se": { label: "iPhone SE", short: "SE", width: 375, height: 667, radius: 42, notch: "none" },
  "pixel-8-pro": {
    label: "Pixel 8 Pro",
    short: "Pixel 8",
    width: 412,
    height: 915,
    radius: 46,
    notch: "punch",
  },
  /*
    The narrowest and one of the shortest viewports the site actually has to
    survive — and the one most orders will come from. 360×800 is the mid-range
    Android size (Galaxy A, Redmi Note), not a flagship, so it is the frame to
    check a price row or a wilaya select against before filming anything.
  */
  "galaxy-a54": {
    label: "Galaxy A54 / Redmi Note",
    short: "A54",
    width: 360,
    height: 800,
    radius: 40,
    notch: "punch",
  },
} as const;

export type DeviceKey = keyof typeof DEVICES;

const STORAGE_KEY = "norlyn-phone-preview";

/**
 * sessionStorage, not component state: recording the splash screen means
 * reloading the page over and over, and a preview that fell back to the
 * desktop layout on every reload would be useless for exactly the shot it
 * exists to get.
 */
function readStored(): { on: boolean; device: DeviceKey } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { on?: unknown; device?: unknown };
      const device =
        typeof parsed.device === "string" && parsed.device in DEVICES
          ? (parsed.device as DeviceKey)
          : "iphone-15-pro";
      return { on: parsed.on === true, device };
    }
  } catch {
    /* private mode, or a shape from an older build — start closed */
  }
  return { on: false, device: "iphone-15-pro" };
}

function persist(state: { on: boolean; device: DeviceKey }): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* nothing to do — the preview just won't survive a reload */
  }
}

interface PhonePreviewState {
  on: boolean;
  device: DeviceKey;
  toggle: () => void;
  close: () => void;
  setDevice: (device: DeviceKey) => void;
}

export const usePhonePreview = create<PhonePreviewState>()((set, get) => ({
  ...readStored(),
  toggle: () => {
    const next = { on: !get().on, device: get().device };
    persist(next);
    set(next);
  },
  close: () => {
    const next = { on: false, device: get().device };
    persist(next);
    set(next);
  },
  setDevice: (device) => {
    const next = { on: get().on, device };
    persist(next);
    set(next);
  },
}));
