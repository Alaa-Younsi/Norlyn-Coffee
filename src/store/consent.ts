import { create } from "zustand";

/**
 * Cookie / tracker consent.
 *
 * Two categories, matching the cookie policy (src/data/legal.ts):
 *  - essential — the cart, the language, this choice itself. Always on: the
 *    shop cannot work without them, and they never leave the visitor's device.
 *  - marketing — the Meta Pixel(s) configured in the admin. OFF until the
 *    visitor says yes. MetaPixelProvider initialises nothing and sends nothing
 *    while this is false, so "Refuse" means no request to Meta at all.
 *
 * Stored in localStorage (the choice is itself essential), with the policy
 * version, so a material change to the policy can ask again by bumping it.
 */

const STORAGE_KEY = "norlyn-consent";
export const CONSENT_VERSION = 1;

interface StoredConsent {
  v: number;
  marketing: boolean;
  at: string;
}

interface ConsentState {
  /** the visitor has answered (for this policy version) */
  decided: boolean;
  marketing: boolean;
  /** the banner is open (first visit, or reopened from the footer) */
  open: boolean;
  decide: (marketing: boolean) => void;
  reopen: () => void;
}

function read(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    return parsed.v === CONSENT_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

const initial = read();

export const useConsent = create<ConsentState>()((set) => ({
  decided: initial !== null,
  marketing: initial?.marketing ?? false,
  open: initial === null,
  decide: (marketing) => {
    try {
      const value: StoredConsent = { v: CONSENT_VERSION, marketing, at: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // storage unavailable — the choice holds for this visit only
    }
    set({ decided: true, marketing, open: false });
  },
  reopen: () => set({ open: true }),
}));
