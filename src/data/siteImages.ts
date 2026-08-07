import { mediaSrc } from "@/lib/media";
import { IMAGE_SLOTS } from "@/lib/imageSlots";
import type { SiteImage } from "@/types/db";

/**
 * The `site_images` map used when Supabase isn't configured — every slot
 * filled with the photograph its definition ships.
 *
 * Derived, not written out. This file used to repeat each slot's url and alt
 * text beside `lib/imageSlots.ts`, so a new slot had to be added twice and a
 * changed photo edited twice; the two lists drifted the moment anyone forgot.
 * The slot definitions are the source of truth now — see `ImageSlotDef.fallback`.
 */
const SEEDED_AT = "2026-01-01T00:00:00Z";

export const FALLBACK_SITE_IMAGES: Record<string, SiteImage> = Object.fromEntries(
  IMAGE_SLOTS.map((definition): [string, SiteImage] => [
    definition.slot,
    {
      slot: definition.slot,
      url: mediaSrc(definition.fallback),
      alt_fr: definition.alt_fr,
      alt_ar: definition.alt_ar,
      updated_at: SEEDED_AT,
    },
  ]),
);
