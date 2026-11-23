/**
 * The store's public contact details — one source of truth.
 *
 * These strings used to be typed into the footer and the contact page
 * separately, which is how a site ends up advertising two different addresses
 * after one of them is changed. Anything that shows a way to reach Norlyn
 * reads it from here.
 *
 * Not translated on purpose: an address and a phone number are the same in
 * every language, and a localised copy of either is a copy that can drift.
 */

/** Where order and wholesale mail actually lands. */
export const CONTACT_EMAIL = "contact@norlyncoffee.com";

/**
 * The official line (Nov 23 2026). `CONTACT_PHONE_TEL` must be the same number
 * in E.164 so a tap on a phone dials it.
 */
export const CONTACT_PHONE = "0560 88 86 00";
export const CONTACT_PHONE_TEL = "+213560888600";

/** Postal city + country, as printed in the footer. */
export const CONTACT_LOCATION = "Norlyn Coffee — Alger, Algérie";

export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;
export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE_TEL}`;
