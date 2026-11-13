import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";

/**
 * The site is dark-only (Nov 2026). There is no light mode and no toggle: the
 * palette in index.css is built for espresso and gold, and index.html already
 * boots with `data-theme="dark"`, so this provider only re-asserts it.
 *
 * `useTheme()` keeps its old shape (`theme` is always "dark") so the code that
 * adapts colours to the surface — readableAccent, the admin charts — needs no
 * second branch.
 */
type Theme = "dark";

interface ThemeContextValue {
  theme: Theme;
}

const VALUE: ThemeContextValue = { theme: "dark" };
const ThemeContext = createContext<ThemeContextValue>(VALUE);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    try {
      // a stored "light" from before the switch must not linger anywhere
      localStorage.removeItem("norlyn-theme");
    } catch {
      // storage unavailable — nothing to clean up
    }
  }, []);

  return <ThemeContext.Provider value={VALUE}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook belong together
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
