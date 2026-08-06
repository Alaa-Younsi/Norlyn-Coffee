import type { TranslationKey } from "@/i18n/translations";

/**
 * The admin's write-feedback bus.
 *
 * Every Supabase write in the dashboard already checks its `error` — but a
 * checked error that nothing renders is, from the client's chair, the same as
 * an ignored one. It produces the worst failure this app has: the dialog
 * closes, the list re-renders from cache, and the change *looks* saved. The
 * client finds out days later, as "I changed the price and it went back".
 *
 * This is a module-level bus rather than a React context on purpose. The
 * highest-value caller is not a component at all — it is the QueryClient's
 * `MutationCache.onError` in `main.tsx`, which catches EVERY admin mutation in
 * one place. Twenty-one hand-wired `onError` callbacks would drift the first
 * time someone adds a hook; a cache-level handler cannot be forgotten.
 *
 * Callers pass a translation KEY, not a string: the bus has no language, and
 * `<AdminToasts>` (which does) translates at paint time — so a toast fired
 * during a language switch still reads correctly.
 */

export type AdminToastKind = "success" | "error";

export interface AdminToastRequest {
  kind: AdminToastKind;
  messageKey: TranslationKey;
}

const listeners = new Set<(request: AdminToastRequest) => void>();

function emit(kind: AdminToastKind, messageKey: TranslationKey): void {
  listeners.forEach((listener) => listener({ kind, messageKey }));
}

export const adminToast = {
  success: (messageKey: TranslationKey = "admin.toast.saved") => emit("success", messageKey),
  error: (messageKey: TranslationKey = "admin.toast.writeError") => emit("error", messageKey),
};

/** Used by the renderer; returns its own unsubscribe. */
export function subscribeAdminToast(listener: (request: AdminToastRequest) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
