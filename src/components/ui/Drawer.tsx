import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
}

/**
 * Slide-in side panel, docked to the inline-end side. framer-motion x offsets
 * are physical, so the slide direction must branch on dir explicitly.
 */
export function Drawer({ open, onClose, children, title }: DrawerProps) {
  const { dir } = useLanguage();
  const offscreen = dir === "rtl" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.button
            aria-label="close"
            className="absolute inset-0 h-full w-full cursor-default bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={cn(
              "absolute top-0 h-full w-[min(92vw,26rem)] bg-panel border-line flex flex-col",
              dir === "rtl" ? "left-0 border-e" : "right-0 border-s",
            )}
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ type: "tween", duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="font-display text-2xl">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-muted hover:bg-panel-2 hover:text-ink cursor-pointer"
                  aria-label="close drawer"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
