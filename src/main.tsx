import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Self-hosted fonts — no render-blocking Google Fonts <link>, no third-party
// origin in the CSP. The `opsz` files carry the optical-size axis the hero and
// the 12px body text both rely on (index.css: font-optical-sizing: auto); each
// is unicode-range-split, so a French page fetches only the `latin` slice and
// Arabic UI text pulls Cairo's `arabic` slice on demand. Imported before
// index.css so the @font-face rules land first.
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource-variable/cairo/wght.css";
import "./index.css";
import { App } from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { adminToast } from "@/lib/adminToast";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

const queryClient = new QueryClient({
  // Every `useMutation` in this app is an admin write (the storefront's only
  // write is the place_order RPC, called directly). A mutation that throws with
  // no `onError` is swallowed by React Query — nothing renders, nothing logs,
  // and the admin sees a button that did nothing. Catching it at the cache
  // means a new write hook cannot forget to report itself.
  //
  // Pages that also render their own inline error keep it: the toast says "it
  // failed", the inline message says why.
  mutationCache: new MutationCache({
    onError: () => adminToast.error(),
    // and the other half of the same problem: an inline edit that saves with no
    // acknowledgement leaves the admin re-checking the row to be sure
    onSuccess: () => adminToast.success(),
  }),
  defaultOptions: {
    queries: {
      // a catalogue doesn't change while the shopper tabs away — refetching
      // burns their data plan and the store's Supabase egress
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      retry: 1,
    },
  },
});

// `history.scrollRestoration` is set in index.html, not here: by the time this
// module has downloaded its import graph the browser has already restored the
// old position and drawn a frame at it. See the comment above that script.

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
