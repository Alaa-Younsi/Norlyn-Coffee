import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CountdownData } from "@/lib/pageBuilder/types";
import { cn } from "@/lib/utils";

/**
 * Where the clock runs to:
 *  - date      a fixed end, the same for everyone
 *  - evergreen N hours from THIS visitor's first view (remembered per block)
 *  - daily     tonight's midnight, local time
 * Display only: the price itself ends with `packs.ends_at`, server-side.
 */
function resolveTarget(data: CountdownData, key: string): { end: number; total: number } {
  const now = Date.now();
  if (data.mode === "date") {
    const end = new Date(data.until).getTime();
    return { end: Number.isFinite(end) ? end : now, total: 7 * 864e5 };
  }
  if (data.mode === "daily") {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return { end: d.getTime(), total: 864e5 };
  }
  const total = Math.max(1, data.hours) * 36e5;
  let start = now;
  try {
    const saved = Number(localStorage.getItem(key));
    if (saved && saved <= now && now - saved < total) start = saved;
    else localStorage.setItem(key, String(now));
  } catch {
    /* private mode — the clock just starts at this view */
  }
  return { end: start + total, total };
}

function useClock(data: CountdownData, key: string) {
  // keyed on the settings that move the target, so editing them in the admin
  // preview restarts the clock (the evergreen start stays remembered)
  const target = useMemo(
    () => resolveTarget(data, key),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.mode, data.until, data.hours, key],
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, target.end - now);
  return {
    left,
    progress: Math.min(1, left / target.total),
    d: Math.floor(left / 864e5),
    h: Math.floor((left / 36e5) % 24),
    m: Math.floor((left / 6e4) % 60),
    s: Math.floor((left / 1e3) % 60),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({
  data,
  blockId,
  labels,
  expiredText,
}: {
  data: CountdownData;
  blockId: string;
  labels: [string, string, string, string];
  expiredText: string;
}) {
  const clock = useClock(data, `pb-cd-${blockId}`);
  if (clock.left <= 0) {
    if (data.hideWhenExpired) return null;
    return <p className="font-display text-2xl text-[var(--pb-muted)]">{expiredText}</p>;
  }
  const units = [
    { v: clock.d, l: labels[0], max: 30 },
    { v: clock.h, l: labels[1], max: 24 },
    { v: clock.m, l: labels[2], max: 60 },
    { v: clock.s, l: labels[3], max: 60 },
  ].filter((u, i) => i > 0 || u.v > 0);

  if (data.style === "minimal") {
    return (
      <p dir="ltr" className="font-display text-5xl tabular-nums tracking-tight @3xl:text-7xl">
        {units.map((u, i) => (
          <span key={u.l}>
            {pad(u.v)}
            {i < units.length - 1 && <span className="mx-1 text-[var(--pb-accent)] opacity-70">:</span>}
          </span>
        ))}
      </p>
    );
  }

  if (data.style === "bar") {
    return (
      <div className="mx-auto w-full max-w-xl">
        <p dir="ltr" className="font-display text-3xl tabular-nums">
          {units.map((u) => `${pad(u.v)}${u.l.slice(0, 1)}`).join("  ")}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--pb-text)_12%,transparent)]">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--pb-accent),var(--pb-accent2))]"
            animate={{ width: `${clock.progress * 100}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  if (data.style === "ring") {
    return (
      <div dir="ltr" className="flex flex-wrap justify-center gap-4 @3xl:gap-8">
        {units.map((u) => {
          const r = 42;
          const c = 2 * Math.PI * r;
          return (
            <div key={u.l} className="relative h-24 w-24 @3xl:h-32 @3xl:w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" strokeWidth="5" className="stroke-[color-mix(in_srgb,var(--pb-text)_12%,transparent)]" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r={r}
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="stroke-[var(--pb-accent)]"
                  strokeDasharray={c}
                  animate={{ strokeDashoffset: c * (1 - u.v / u.max) }}
                  transition={{ duration: 0.6 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl tabular-nums @3xl:text-4xl">{pad(u.v)}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--pb-muted)]">{u.l}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // flip + blocks
  return (
    <div dir="ltr" className="flex flex-wrap justify-center gap-2.5 @3xl:gap-4">
      {units.map((u) => (
        <div key={u.l} className="flex flex-col items-center gap-2">
          <div className="flex gap-1">
            {pad(u.v)
              .split("")
              .map((digit, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative flex h-16 w-11 items-center justify-center overflow-hidden rounded-[calc(var(--pb-radius)*0.45)] border border-[color-mix(in_srgb,var(--pb-text)_12%,transparent)] bg-[var(--pb-surface)] font-display text-4xl tabular-nums shadow-[0_12px_30px_-12px_rgb(0_0_0/0.6)] @3xl:h-24 @3xl:w-16 @3xl:text-6xl",
                    data.style === "flip" && "[perspective:300px]",
                  )}
                >
                  {data.style === "flip" && (
                    <span aria-hidden className="absolute inset-x-0 top-1/2 z-10 h-px bg-[color-mix(in_srgb,var(--pb-bg)_80%,transparent)]" />
                  )}
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={digit}
                      initial={data.style === "flip" ? { rotateX: -90, opacity: 0 } : { y: "-60%", opacity: 0 }}
                      animate={{ rotateX: 0, y: 0, opacity: 1 }}
                      exit={data.style === "flip" ? { rotateX: 90, opacity: 0 } : { y: "60%", opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="block [backface-visibility:hidden]"
                    >
                      {digit}
                    </motion.span>
                  </AnimatePresence>
                </div>
              ))}
          </div>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--pb-muted)]">{u.l}</span>
        </div>
      ))}
    </div>
  );
}
