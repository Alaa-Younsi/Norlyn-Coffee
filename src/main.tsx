import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { App } from "./App";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
