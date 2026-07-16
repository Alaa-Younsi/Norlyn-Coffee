import type { TranslationKey } from "@/i18n/translations";

/**
 * Maps place_order RPC ERR_* codes to translation keys — shared by
 * Checkout and InlineCheckout so both surface the same actionable message.
 */
export function orderErrorKey(message: string | undefined): TranslationKey {
  if (!message) return "err.generic";
  if (message.includes("ERR_CART_EMPTY")) return "err.cartEmpty";
  if (message.includes("ERR_STOCK")) return "err.stock";
  if (message.includes("ERR_PRODUCT_UNAVAILABLE")) return "err.productUnavailable";
  if (message.includes("ERR_WILAYA_DISABLED")) return "err.wilayaDisabled";
  if (message.includes("ERR_RATE_LIMIT")) return "err.rateLimit";
  if (message.includes("ERR_INVALID_INPUT")) return "err.invalidInput";
  return "err.generic";
}
