import { useContext, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Copy, Image as ImageIcon, Plus, Trash2, Video } from "lucide-react";
import { UploadButton } from "@/components/admin/UploadButton";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { safeUrl } from "@/lib/pageBuilder/defaults";
import type { L10n, Media } from "@/lib/pageBuilder/types";
import { cn } from "@/lib/utils";
import { EditLangContext, tri, useTx } from "./editorI18n";

export function EditLangSwitch() {
  const { editLang, setEditLang } = useContext(EditLangContext);
  const tx = useTx();
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-panel p-1 text-xs">
      <span className="px-2 text-muted">{tx(tri("Texte en", "Writing in", "الكتابة بـ"))}</span>
      {(["fr", "ar", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setEditLang(l)}
          className={cn(
            "cursor-pointer rounded-full px-3 py-1 font-semibold uppercase transition-colors",
            editLang === l ? "bg-brand text-cream" : "text-muted hover:text-ink",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted/80">{hint}</span>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  multiline,
  hint,
}: {
  label: string;
  value: L10n;
  onChange: (v: L10n) => void;
  multiline?: boolean;
  hint?: string;
}) {
  const { editLang } = useContext(EditLangContext);
  const current = value?.[editLang] ?? "";
  const fallback = editLang !== "fr" ? value?.fr : "";
  const props = {
    value: current,
    dir: editLang === "ar" ? ("rtl" as const) : ("ltr" as const),
    placeholder: fallback || "",
    onChange: (e: { target: { value: string } }) => onChange({ ...value, [editLang]: e.target.value }),
  };
  return (
    <Row label={`${label} · ${editLang.toUpperCase()}`} hint={hint}>
      {multiline ? <Textarea rows={4} {...props} /> : <Input {...props} />}
    </Row>
  );
}

export function PlainField({
  label,
  value,
  onChange,
  type = "text",
  hint,
  min,
  max,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number" | "datetime-local" | "url";
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Row label={label} hint={hint}>
      <Input type={type} value={value} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value)} />
    </Row>
  );
}

export function NumberField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <PlainField
      {...props}
      type="number"
      value={Number.isFinite(props.value) ? props.value : 0}
      onChange={(v) => props.onChange(v === "" ? 0 : Number(v))}
    />
  );
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <Row label={label} hint={hint}>
      <div className="relative">
        <Select
          value={String(value)}
          onChange={(e) => {
            const hit = options.find((o) => String(o.value) === e.target.value);
            if (hit) onChange(hit.value);
          }}
        >
          {options.map((o) => (
            <option key={String(o.value)} value={String(o.value)}>
              {o.label}
            </option>
          ))}
        </Select>
        <ChevronDown size={15} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </Row>
  );
}

/** a row of pill buttons — quicker than a select for 2–6 visual choices */
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Row label={label}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              value === o.value ? "border-brand bg-brand/15 text-ink" : "border-line text-muted hover:border-brand/60 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Row>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-xl border border-line px-4 py-3">
      <Switch label={label} checked={value} onChange={onChange} />
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-panel px-2 py-1.5">
        <input
          type="color"
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-xs uppercase outline-none"
          dir="ltr"
        />
      </div>
    </Row>
  );
}

/** URL or upload, image or video, with a live thumbnail */
export function MediaField({
  label,
  value,
  onChange,
  allowVideo = true,
}: {
  label: string;
  value: Media | undefined;
  onChange: (m: Media) => void;
  allowVideo?: boolean;
}) {
  const tx = useTx();
  const media: Media = value ?? { kind: "image", url: "" };
  const url = safeUrl(media.url);
  return (
    <Row label={label}>
      <div className="space-y-2 rounded-xl border border-line bg-panel/60 p-3">
        <div className="flex gap-3">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-panel-2">
            {url ? (
              media.kind === "video" ? (
                <video src={url} muted playsInline className="h-full w-full object-cover" />
              ) : (
                <img src={url} alt="" className="h-full w-full object-cover" />
              )
            ) : (
              <ImageIcon size={20} className="text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            {allowVideo && (
              <div className="flex gap-1">
                {(["image", "video"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onChange({ ...media, kind: k })}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
                      media.kind === k ? "border-brand bg-brand/15" : "border-line text-muted",
                    )}
                  >
                    {k === "image" ? <ImageIcon size={12} /> : <Video size={12} />}
                    {k === "image" ? tx(tri("Image", "Image", "صورة")) : tx(tri("Vidéo", "Video", "فيديو"))}
                  </button>
                ))}
              </div>
            )}
            <Input
              value={media.url}
              dir="ltr"
              placeholder="https://… ou /images/…"
              onChange={(e) => onChange({ ...media, url: e.target.value })}
              className="py-1.5 text-xs"
            />
            <UploadButton
              kind={media.kind}
              prefix="pages"
              onUploaded={(u) => onChange({ ...media, url: u })}
              label={tx(tri("Téléverser", "Upload", "رفع"))}
            />
          </div>
        </div>
        {media.kind === "video" && (
          <Input
            value={media.poster ?? ""}
            dir="ltr"
            placeholder={tx(tri("Image d'attente (poster) — URL", "Poster image — URL", "صورة الانتظار — رابط"))}
            onChange={(e) => onChange({ ...media, poster: e.target.value })}
            className="py-1.5 text-xs"
          />
        )}
      </div>
    </Row>
  );
}

/** generic editable list: add / duplicate / reorder / remove */
export function ListField<T>({
  label,
  items,
  onChange,
  create,
  render,
  title,
  max = 24,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (next: T) => void, index: number) => ReactNode;
  title: (item: T, index: number) => string;
  max?: number;
}) {
  const tx = useTx();
  const [open, setOpen] = useState<number | null>(items.length ? 0 : null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };
  return (
    <Row label={label}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-line bg-panel/60">
            <div className="flex items-center gap-1 px-3 py-2">
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="min-w-0 flex-1 cursor-pointer truncate text-start text-sm font-medium">
                {i + 1}. {title(item, i) || "—"}
              </button>
              <IconBtn label="↑" onClick={() => move(i, -1)}>
                <ArrowUp size={13} />
              </IconBtn>
              <IconBtn label="↓" onClick={() => move(i, 1)}>
                <ArrowDown size={13} />
              </IconBtn>
              <IconBtn
                label="copy"
                onClick={() => items.length < max && onChange([...items.slice(0, i + 1), structuredClone(item), ...items.slice(i + 1)])}
              >
                <Copy size={13} />
              </IconBtn>
              <IconBtn label="delete" danger onClick={() => onChange(items.filter((_, k) => k !== i))}>
                <Trash2 size={13} />
              </IconBtn>
            </div>
            {open === i && <div className="space-y-3 border-t border-line p-3">{render(item, (next) => onChange(items.map((x, k) => (k === i ? next : x))), i)}</div>}
          </div>
        ))}
        {items.length < max && (
          <button
            type="button"
            onClick={() => {
              onChange([...items, create()]);
              setOpen(items.length);
            }}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2.5 text-sm text-muted hover:border-brand hover:text-ink"
          >
            <Plus size={14} />
            {tx(tri("Ajouter", "Add", "إضافة"))}
          </button>
        )}
      </div>
    </Row>
  );
}

export function IconBtn({
  children,
  onClick,
  label,
  danger,
  active,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "cursor-pointer rounded-lg p-1.5 transition-colors",
        danger ? "text-muted hover:bg-red-900/30 hover:text-red-400" : "text-muted hover:bg-panel-2 hover:text-ink",
        active && "text-brand",
      )}
    >
      {children}
    </button>
  );
}

export function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-line bg-panel">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold">
        {title}
        <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-4 border-t border-line p-4">{children}</div>}
    </div>
  );
}
