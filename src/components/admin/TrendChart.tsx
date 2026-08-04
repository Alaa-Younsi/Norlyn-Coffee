import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Price } from "@/components/ui/Price";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SeriesPoint } from "@/lib/finance";
import { cn } from "@/lib/utils";

const W = 800;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 26, left: 16 };

type SeriesKey = "revenue" | "profit" | "expenses";

const SERIES: Array<{ key: SeriesKey; token: string; labelKey: "admin.fin.revenue" | "admin.fin.net" | "admin.fin.expenses" }> = [
  { key: "revenue", token: "var(--viz-revenue)", labelKey: "admin.fin.revenue" },
  { key: "profit", token: "var(--viz-profit)", labelKey: "admin.fin.net" },
  { key: "expenses", token: "var(--viz-expense)", labelKey: "admin.fin.expenses" },
];

/**
 * Hand-rolled SVG, no chart library. All three series are DA, so they share
 * ONE y-axis — a second scale would only make incomparable things look
 * comparable.
 */
export function TrendChart({ points }: { points: SeriesPoint[] }) {
  const { t } = useLanguage();
  const [hover, setHover] = useState<number | null>(null);

  const { min, max } = useMemo(() => {
    const values = points.flatMap((p) => [p.revenue, p.profit, p.expenses]);
    // floor the domain at 0 so a loss reads as BELOW the line, not as a short bar
    const lo = Math.min(0, ...values);
    let hi = Math.max(0, ...values);
    if (hi === lo) hi = lo + 1; // a flat-zero dataset would divide by zero
    return { min: lo, max: hi };
  }, [points]);

  if (points.length === 0) {
    return <p className="p-6 text-sm text-muted">{t("admin.fin.chartNoData")}</p>;
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

  const x = (i: number) => PAD.left + i * stepX;
  const y = (value: number) => PAD.top + innerH - ((value - min) / (max - min)) * innerH;

  const path = (key: SeriesKey) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p[key])}`).join(" ");

  const active = hover === null ? null : points[hover];
  const flip = hover !== null && hover > points.length / 2;

  return (
    <div>
      <div className="flex flex-wrap gap-4 px-1 pb-3">
        {/* permanent legend — with three series, identity must never rest on
            colour alone */}
        {SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-2 text-xs text-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: series.token }}
            />
            {t(series.labelKey)}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          onMouseLeave={() => setHover(null)}
        >
          {/* stronger zero rule */}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(0)}
            y2={y(0)}
            stroke="rgb(var(--c-line))"
            strokeWidth={1.5}
          />

          {SERIES.map((series) => (
            <path
              key={series.key}
              d={path(series.key)}
              fill="none"
              stroke={series.token}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* the hit target is the whole COLUMN mapped through the viewBox, not
              the 5px marker — chasing a marker with a finger is how these become
              unusable on a phone */}
          {points.map((point, i) => (
            <rect
              key={point.bucket}
              x={x(i) - stepX / 2}
              y={PAD.top}
              width={Math.max(stepX, 8)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          ))}

          {hover !== null && (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="rgb(var(--c-brand) / 0.4)"
                strokeDasharray="3 3"
              />
              {/* markers only on the hovered column */}
              {SERIES.map((series) => (
                <circle
                  key={series.key}
                  cx={x(hover)}
                  cy={y(points[hover][series.key])}
                  r={4}
                  fill={series.token}
                />
              ))}
            </>
          )}

          {/* label only first / last / hovered */}
          {points.map((point, i) => {
            const show = i === 0 || i === points.length - 1 || i === hover;
            if (!show) return null;
            return (
              <text
                key={`label-${point.bucket}`}
                x={x(i)}
                y={H - 6}
                textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                fontSize={11}
                fill="rgb(var(--c-muted))"
              >
                {point.label}
              </text>
            );
          })}
        </svg>

        {active && (
          // flipped to the far side past the midpoint so it never covers the
          // line being read (RTL-aware logical sides)
          <div
            className={cn(
              "pointer-events-none absolute top-2 rounded-xl border border-line bg-panel/95 px-3 py-2 text-xs shadow-lg backdrop-blur",
              flip ? "start-2" : "end-2",
            )}
          >
            <p className="font-medium">{active.label}</p>
            {SERIES.map((series) => (
              <p key={series.key} className="mt-0.5 flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: series.token }}
                />
                <Price value={active[series.key]} className="tabular-nums" />
              </p>
            ))}
          </div>
        )}
      </div>

      {/* the numbers stay available as a table: the light-mode series sit under
          3:1 contrast against the panel */}
      <Panel className="mt-4 overflow-x-auto border-0 bg-transparent shadow-none">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
              <th className="px-3 py-2 text-start">—</th>
              {SERIES.map((series) => (
                <th key={series.key} className="px-3 py-2 text-end">
                  {t(series.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.bucket} className="border-b border-line/60 last:border-0">
                <td className="px-3 py-1.5 text-muted">{point.label}</td>
                {SERIES.map((series) => (
                  <td key={series.key} className="px-3 py-1.5 text-end tabular-nums">
                    <Price value={point[series.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
