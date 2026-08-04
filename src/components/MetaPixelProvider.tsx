import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useActivePixels } from "@/hooks/useMetaPixels";
import { initPixels, matchPixels, trackEvent } from "@/lib/metaPixel";
import type { PixelContext, PixelParams } from "@/lib/metaPixel";
import type { PixelEventKey } from "@/types/db";

interface RouteContext {
  productSlug?: string;
  landingSlug?: string;
  extraPixelIds?: string[];
}

interface PixelApi {
  track: (key: PixelEventKey, params?: PixelParams, eventId?: string) => void;
  setContext: (ctx: RouteContext) => void;
}

const PixelCtx = createContext<PixelApi | null>(null);

/**
 * Wraps the routed tree (inside BrowserRouter, outside the pages). Decides
 * which DB-configured pixels are live for the current route and owns the
 * PageView bookkeeping.
 */
export function MetaPixelProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { data: pixels } = useActivePixels();
  // The context is STAMPED with the path it was registered from, so a route
  // that unmounts can't leave its slug behind for the next one — derived,
  // rather than reset from an effect (which would cascade a second render).
  const [routeCtx, setRouteCtx] = useState<RouteContext & { path?: string }>({});

  // Firing conversions while the owner clicks around their own dashboard
  // poisons every campaign's data with staff traffic.
  const isAdmin = pathname.startsWith("/admin");

  const active = useMemo(() => {
    if (isAdmin || !pixels || pixels.length === 0) return [];
    const fresh = routeCtx.path === pathname ? routeCtx : {};
    const ctx: PixelContext = { pathname, ...fresh };
    return matchPixels(pixels, ctx);
  }, [isAdmin, pixels, pathname, routeCtx]);

  useEffect(() => {
    if (active.length > 0) initPixels(active);
  }, [active]);

  // PageView bookkeeping is per (path, pixel id), NOT per path: a product page
  // registers its slug one render after it mounts, which widens the matched
  // set. A plain "already sent for this path" flag either double-fires the
  // first batch or never fires the newly-matched ones.
  const sent = useRef<{ path: string; ids: Set<string> }>({ path: "", ids: new Set() });

  useEffect(() => {
    if (active.length === 0) return;
    if (sent.current.path !== pathname) sent.current = { path: pathname, ids: new Set() };

    const fresh = active.filter((pixel) => !sent.current.ids.has(pixel.id));
    if (fresh.length === 0) return;

    fresh.forEach((pixel) => sent.current.ids.add(pixel.id));
    trackEvent(fresh, "page_view");
  }, [active, pathname]);

  const track = useCallback(
    (key: PixelEventKey, params?: PixelParams, eventId?: string) => {
      if (active.length === 0) return;
      trackEvent(active, key, params, eventId);
    },
    [active],
  );

  // Routes call this from an effect whose deps are recreated each render —
  // without the value comparison it is an infinite re-render loop.
  const setContext = useCallback(
    (next: RouteContext) => {
      setRouteCtx((prev) => {
        const samePath = prev.path === pathname;
        const sameProduct = prev.productSlug === next.productSlug;
        const sameLanding = prev.landingSlug === next.landingSlug;
        const sameExtras =
          (prev.extraPixelIds ?? []).join() === (next.extraPixelIds ?? []).join();
        if (samePath && sameProduct && sameLanding && sameExtras) return prev;
        return { ...next, path: pathname };
      });
    },
    [pathname],
  );

  const value = useMemo(() => ({ track, setContext }), [track, setContext]);

  return <PixelCtx.Provider value={value}>{children}</PixelCtx.Provider>;
}

const NOOP: PixelApi = { track: () => {}, setContext: () => {} };

// eslint-disable-next-line react-refresh/only-export-components -- provider + hook belong together
export function usePixel(): PixelApi {
  return useContext(PixelCtx) ?? NOOP;
}
