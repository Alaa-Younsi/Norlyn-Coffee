import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { subscribeAdminToast, type AdminToastRequest } from "@/lib/adminToast";

interface Toast extends AdminToastRequest {
  id: number;
}

const VISIBLE_MS = 4200;

/**
 * Renders whatever `lib/adminToast.ts` emits — see that file for why the bus
 * lives outside React. Mounted once in AdminLayout, OUTSIDE the routed
 * <Outlet />, so a page that fires a toast and then navigates away still gets
 * it shown.
 */
export function AdminToasts() {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<Toast[]>([]);
  // timers live here so unmounting the admin clears them — a stray setTimeout
  // calling setState after unmount is a dev warning and a real leak
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const nextId = useRef(0);

  useEffect(() => {
    const pending = timers.current;
    const unsubscribe = subscribeAdminToast((request) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { ...request, id }]);
      const timer = setTimeout(() => {
        pending.delete(timer);
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, VISIBLE_MS);
      pending.add(timer);
    });
    return () => {
      unsubscribe();
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  return (
    // above the mobile sidebar drawer, which is z-50
    <div
      className="pointer-events-none fixed bottom-4 end-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      // a failed save has to reach a screen reader too, not just the eye
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={
              toast.kind === "error"
                ? "pointer-events-auto flex items-start gap-2.5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-lg dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                : "pointer-events-auto flex items-start gap-2.5 rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-ink shadow-lg"
            }
          >
            {toast.kind === "error" ? (
              <XCircle size={17} className="mt-px shrink-0" />
            ) : (
              <CheckCircle2 size={17} className="mt-px shrink-0 text-brand" />
            )}
            <span className="min-w-0">{t(toast.messageKey)}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
