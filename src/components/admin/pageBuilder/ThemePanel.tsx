import { THEME_PRESETS } from "@/lib/pageBuilder/defaults";
import { ANIMS } from "@/lib/pageBuilder/types";
import type { BgFx, Theme, ThemePresetKey } from "@/lib/pageBuilder/types";
import { cn } from "@/lib/utils";
import { Choice, ColorField, Group, Row, SelectField, Toggle } from "./fields";
import { tri, useTx } from "./editorI18n";
import { ANIM_LABEL, BGFX_LABEL, PRESET_LABEL } from "./labels";

export function ThemePanel({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  const tx = useTx();
  // touching any colour by hand turns the preset into "custom"
  const setColor = (key: "bg" | "surface" | "text" | "muted" | "accent" | "accent2", value: string) =>
    onChange({ ...theme, [key]: value, preset: "custom" });
  const set = (patch: Partial<Theme>) => onChange({ ...theme, ...patch });

  return (
    <div className="space-y-4">
      <Group title={tx(tri("Ambiance & couleurs", "Mood & colours", "الأجواء والألوان"))}>
        <Row label={tx(tri("Palettes", "Palettes", "لوحات الألوان"))}>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(THEME_PRESETS) as Exclude<ThemePresetKey, "custom">[]).map((key) => {
              const p = THEME_PRESETS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ ...theme, ...p, preset: key })}
                  className={cn(
                    "cursor-pointer overflow-hidden rounded-xl border text-start transition-all hover:-translate-y-0.5",
                    theme.preset === key ? "border-brand ring-2 ring-brand/30" : "border-line",
                  )}
                >
                  <span className="flex h-10" style={{ background: p.bg }}>
                    <span className="m-2 flex-1 rounded-md" style={{ background: p.surface }} />
                    <span className="my-3 me-2 w-4 rounded-full" style={{ background: p.accent }} />
                  </span>
                  <span className="block px-2 py-1.5 text-[11px] font-medium">{tx(PRESET_LABEL[key])}</span>
                </button>
              );
            })}
          </div>
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label={tx(tri("Fond", "Background", "الخلفية"))} value={theme.bg} onChange={(v) => setColor("bg", v)} />
          <ColorField label={tx(tri("Cartes", "Surfaces", "البطاقات"))} value={theme.surface} onChange={(v) => setColor("surface", v)} />
          <ColorField label={tx(tri("Texte", "Text", "النص"))} value={theme.text} onChange={(v) => setColor("text", v)} />
          <ColorField label={tx(tri("Texte doux", "Soft text", "نص خافت"))} value={theme.muted} onChange={(v) => setColor("muted", v)} />
          <ColorField label={tx(tri("Accent", "Accent", "لون مميز"))} value={theme.accent} onChange={(v) => setColor("accent", v)} />
          <ColorField label={tx(tri("Accent 2", "Accent 2", "لون مميز 2"))} value={theme.accent2} onChange={(v) => setColor("accent2", v)} />
        </div>
      </Group>

      <Group title={tx(tri("Typographie & formes", "Type & shapes", "الخطوط والأشكال"))}>
        <Choice
          label={tx(tri("Police des titres", "Headline font", "خط العناوين"))}
          value={theme.font}
          options={[
            { value: "display", label: "Fraunces" },
            { value: "serif", label: tx(tri("Italique", "Italic", "مائل")) },
            { value: "sans", label: tx(tri("Moderne", "Modern sans", "حديث")) },
          ]}
          onChange={(v) => set({ font: v })}
        />
        <Row label={`${tx(tri("Arrondi des coins", "Corner radius", "استدارة الزوايا"))} · ${theme.radius}px`}>
          <input
            type="range"
            min={0}
            max={48}
            value={theme.radius}
            onChange={(e) => set({ radius: Number(e.target.value) })}
            className="w-full accent-[rgb(var(--c-brand))]"
          />
        </Row>
      </Group>

      <Group title={tx(tri("Effets & mouvement", "Effects & motion", "التأثيرات والحركة"))}>
        <SelectField
          label={tx(tri("Décor de fond", "Background effect", "تأثير الخلفية"))}
          value={theme.bgFx}
          options={(Object.keys(BGFX_LABEL) as BgFx[]).map((v) => ({ value: v, label: tx(BGFX_LABEL[v]) }))}
          onChange={(v) => set({ bgFx: v })}
        />
        <SelectField
          label={tx(tri("Animation d'entrée par défaut", "Default entrance", "حركة الظهور الافتراضية"))}
          value={theme.anim}
          options={ANIMS.map((a) => ({ value: a, label: tx(ANIM_LABEL[a]) }))}
          onChange={(v) => set({ anim: v })}
        />
        <Choice
          label={tx(tri("Vitesse", "Speed", "السرعة"))}
          value={theme.speed}
          options={[
            { value: "calm", label: tx(tri("Douce", "Calm", "هادئة")) },
            { value: "normal", label: tx(tri("Normale", "Normal", "عادية")) },
            { value: "snappy", label: tx(tri("Vive", "Snappy", "سريعة")) },
          ]}
          onChange={(v) => set({ speed: v })}
        />
        <Toggle label={tx(tri("Éléments en cascade", "Items cascade in", "ظهور العناصر تباعاً"))} value={theme.stagger} onChange={(v) => set({ stagger: v })} />
        <Toggle label={tx(tri("Grain pellicule", "Film grain", "حبيبات الفيلم"))} value={theme.grain} onChange={(v) => set({ grain: v })} />
        <Toggle label={tx(tri("Halos lumineux", "Glow halos", "هالات ضوئية"))} value={theme.glow} onChange={(v) => set({ glow: v })} />
        <Toggle label={tx(tri("Lumière qui suit la souris", "Light follows the mouse", "ضوء يتبع الفأرة"))} value={theme.cursorGlow} onChange={(v) => set({ cursorGlow: v })} />
        <Toggle label={tx(tri("Barre de progression du défilement", "Scroll progress bar", "شريط تقدم التمرير"))} value={theme.scrollProgress} onChange={(v) => set({ scrollProgress: v })} />
        <Toggle label={tx(tri("Barre d'achat fixe (téléphone)", "Sticky buy bar (phone)", "شريط شراء ثابت (الهاتف)"))} value={theme.stickyBar} onChange={(v) => set({ stickyBar: v })} />
      </Group>
    </div>
  );
}
