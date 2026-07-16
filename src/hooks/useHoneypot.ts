import { useEffect, useRef } from "react";

/**
 * Lightweight bot deterrent shared by both checkout forms: a hidden field
 * real users never fill + a minimum time-to-submit. Deters naive form-filling
 * bots only — the real guard is place_order's server-side validation.
 */
export function useHoneypot() {
  const mountedAt = useRef<number | null>(null);
  useEffect(() => {
    mountedAt.current ??= Date.now();
  }, []);
  const isSpam = (honeypotValue: string | undefined) =>
    Boolean(honeypotValue) ||
    mountedAt.current === null ||
    Date.now() - mountedAt.current < 1500;
  return { isSpam };
}
