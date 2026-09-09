import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

/**
 * The one place a class component is still required — React has no hook
 * equivalent for `getDerivedStateFromError`.
 *
 * Two jobs:
 *
 * 1. STALE CHUNK RECOVERY. Every `lazy()` route is a hashed chunk. Deploy while
 *    a shopper has a tab open and their next navigation fetches a filename that
 *    404s — the dynamic import rejects, and `<Suspense>` does NOT catch a
 *    rejection, only the pending promise. Left alone that is a white screen on
 *    the buying path. We detect that specific error and reload once (guarded by
 *    a sessionStorage flag so a genuinely broken deploy can't reload-loop).
 *
 * 2. LAST-RESORT UI for any other render crash. It renders OUTSIDE the Theme /
 *    Language / Query providers (see main.tsx), so it must not call any app
 *    hook — the markup is styled from the `:root` CSS tokens in index.css and
 *    carries both FR and AR copy since it can't read the active language.
 */

const CHUNK_ERROR_RE =
  /loading chunk|dynamically imported module|failed to fetch dynamically imported|importing a module script failed/i;
const RELOAD_FLAG = "norlyn-chunk-reload-at";
// A stale-chunk error self-heals on one reload. If a second one lands within
// this window the deploy is genuinely broken, not just a tab that missed an
// update — stop reloading and show the fallback instead of looping.
const RELOAD_COOLDOWN_MS = 15_000;

interface Props {
  children: ReactNode;
}

interface State {
  crashed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // The only crash signal the operator gets — there is no logging backend.
    console.error("[ErrorBoundary]", error, info.componentStack);

    if (CHUNK_ERROR_RE.test(error.message)) {
      let recentlyReloaded = false;
      try {
        const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0);
        recentlyReloaded = Date.now() - last < RELOAD_COOLDOWN_MS;
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
      } catch {
        // private mode — fall through to the manual-reload fallback below
      }
      if (!recentlyReloaded) window.location.reload();
    }
  }

  render(): ReactNode {
    if (!this.state.crashed) return this.props.children;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "rgb(var(--c-bg))",
          color: "rgb(var(--c-ink))",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <p style={{ maxWidth: "30rem", lineHeight: 1.7 }}>
          Une erreur est survenue. Rechargez la page, ou commandez directement par téléphone.
        </p>
        <p style={{ maxWidth: "30rem", lineHeight: 1.9, direction: "rtl" }}>
          حدث خطأ. أعد تحميل الصفحة، أو اطلب مباشرة عبر الهاتف.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: "0.5rem",
            padding: "0.6rem 1.4rem",
            borderRadius: "9999px",
            border: "1px solid rgb(var(--c-line))",
            background: "transparent",
            color: "inherit",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          Recharger / إعادة التحميل
        </button>
      </div>
    );
  }
}
