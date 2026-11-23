import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Laptop,
  Maximize2,
  Minimize2,
  Palette,
  Plus,
  Redo2,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  X,
  ArrowUp,
  ArrowDown,
  Layers,
} from "lucide-react";
import { PageRenderer } from "@/components/pageBuilder/PageRenderer";
import type { PageSource } from "@/components/pageBuilder/PageRenderer";
import { createBlock, newId } from "@/lib/pageBuilder/defaults";
import { BLOCK_TYPES } from "@/lib/pageBuilder/types";
import type { Block, PageDoc } from "@/lib/pageBuilder/types";
import type { Lang, Product } from "@/types/db";
import { cn } from "@/lib/utils";
import { BlockSettings } from "./BlockSettings";
import { useAdminPacks } from "@/hooks/usePacks";
import { EditLangSwitch, IconBtn } from "./fields";
import { EditLangContext, tri, useTx } from "./editorI18n";
import { BLOCK_META } from "./labels";
import { ThemePanel } from "./ThemePanel";

const DEVICES = {
  desktop: { width: 1280, icon: Laptop },
  tablet: { width: 820, icon: Tablet },
  phone: { width: 390, icon: Smartphone },
} as const;
type Device = keyof typeof DEVICES;

interface PageEditorProps {
  doc: PageDoc;
  onChange: (doc: PageDoc) => void;
  source: PageSource;
  catalogue: Product[];
}

/**
 * Three panes: the block list (order, visibility, duplicate, delete), the
 * settings of what is selected (or the theme), and a live preview rendered
 * by the very same <PageRenderer> the storefront uses, at desktop, tablet or
 * phone width. Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z undo and redo.
 */
export function PageEditor({ doc, onChange, source, catalogue }: PageEditorProps) {
  const tx = useTx();
  // drafts too, so an offer picker previews packs that aren't published yet
  const { data: adminPacks } = useAdminPacks();
  const [editLang, setEditLang] = useState<Lang>("fr");
  const [device, setDevice] = useState<Device>("desktop");
  const [panel, setPanel] = useState<"blocks" | "theme">("blocks");
  const [selectedId, setSelectedId] = useState<string | null>(doc.blocks[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [past, setPast] = useState<PageDoc[]>([]);
  const [future, setFuture] = useState<PageDoc[]>([]);
  const lastCommit = useRef(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const [paneWidth, setPaneWidth] = useState(900);

  // one history entry per burst of typing, not per keystroke
  const commit = useCallback(
    (next: PageDoc) => {
      const now = Date.now();
      if (now - lastCommit.current > 700) setPast((p) => [...p, doc].slice(-60));
      lastCommit.current = now;
      setFuture([]);
      onChange(next);
    },
    [doc, onChange],
  );

  const undo = useCallback(() => {
    const prev = past.at(-1);
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [doc, ...f]);
    lastCommit.current = 0;
    onChange(prev);
  }, [past, doc, onChange]);

  const redo = useCallback(() => {
    const next = future[0];
    if (!next) return;
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, doc]);
    lastCommit.current = 0;
    onChange(next);
  }, [future, doc, onChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPaneWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullscreen]);

  const selected = doc.blocks.find((b) => b.id === selectedId) ?? null;

  const setBlocks = (blocks: Block[]) => commit({ ...doc, blocks });
  const updateBlock = (block: Block) => setBlocks(doc.blocks.map((b) => (b.id === block.id ? block : b)));
  const move = (index: number, delta: number) => {
    const j = index + delta;
    if (j < 0 || j >= doc.blocks.length) return;
    const next = [...doc.blocks];
    [next[index], next[j]] = [next[j], next[index]];
    setBlocks(next);
  };
  const addBlock = (type: Block["type"]) => {
    const block = createBlock(type);
    const at = selected ? doc.blocks.findIndex((b) => b.id === selected.id) + 1 : doc.blocks.length;
    setBlocks([...doc.blocks.slice(0, at), block, ...doc.blocks.slice(at)]);
    setSelectedId(block.id);
    setAdding(false);
    setPanel("blocks");
  };

  // bring the selected block into view inside the preview
  const select = (id: string) => {
    setSelectedId(id);
    setPanel("blocks");
    requestAnimationFrame(() => {
      previewRef.current?.querySelector(`[data-block-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // drag to reorder in the list
  const dragFrom = useRef<number | null>(null);

  const deviceWidth = DEVICES[device].width;
  const zoom = Math.min(1, (paneWidth - 24) / deviceWidth);
  const ctxValue = useMemo(() => ({ editLang, setEditLang }), [editLang]);

  const preview = (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel-2/40",
        fullscreen ? "fixed inset-0 z-[80] rounded-none bg-bg" : "h-full",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
        {(Object.keys(DEVICES) as Device[]).map((d) => {
          const Icon = DEVICES[d].icon;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              aria-label={d}
              className={cn("cursor-pointer rounded-lg p-2 transition-colors", device === d ? "bg-brand/15 text-brand" : "text-muted hover:text-ink")}
            >
              <Icon size={16} />
            </button>
          );
        })}
        <span className="text-xs text-muted tabular-nums">
          {deviceWidth}px · {Math.round(zoom * 100)}%
        </span>
        <div className="ms-auto flex items-center gap-1">
          <IconBtn label="undo" onClick={undo}>
            <Undo2 size={16} className={cn(!past.length && "opacity-30")} />
          </IconBtn>
          <IconBtn label="redo" onClick={redo}>
            <Redo2 size={16} className={cn(!future.length && "opacity-30")} />
          </IconBtn>
          <IconBtn label="fullscreen" onClick={() => setFullscreen((f) => !f)}>
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </IconBtn>
        </div>
      </div>
      <div ref={previewRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
        <div
          className="mx-auto overflow-hidden rounded-xl shadow-2xl ring-1 ring-line"
          style={{ width: deviceWidth, zoom }}
        >
          <PageRenderer
            doc={doc}
            source={source}
            catalogue={catalogue}
            packs={adminPacks}
            preview
            selectedId={fullscreen ? null : selectedId}
            onSelectBlock={fullscreen ? undefined : select}
          />
        </div>
      </div>
    </div>
  );

  return (
    <EditLangContext.Provider value={ctxValue}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <EditLangSwitch />
        <p className="text-xs text-muted">
          {tx(
            tri(
              "Cliquez sur un bloc dans l'aperçu pour le modifier. Les textes vides en arabe ou en anglais reprennent le français.",
              "Click a block in the preview to edit it. Empty Arabic or English texts fall back to French.",
              "انقر على أي قسم في المعاينة لتعديله. النصوص الفارغة بالعربية أو الإنجليزية تأخذ النص الفرنسي.",
            ),
          )}
        </p>
      </div>

      <div className="grid gap-4 xl:h-[calc(100dvh-13rem)] xl:grid-cols-[16rem_23rem_minmax(0,1fr)]">
        {/* ---------------------------------------------------- block list */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="grid shrink-0 grid-cols-2 gap-1 border-b border-line p-1.5">
            {(["blocks", "theme"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPanel(p)}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2 text-sm font-medium",
                  panel === p ? "bg-brand/15 text-ink" : "text-muted hover:text-ink",
                )}
              >
                {p === "blocks" ? <Layers size={15} /> : <Palette size={15} />}
                {p === "blocks" ? tx(tri("Blocs", "Blocks", "الأقسام")) : tx(tri("Thème", "Theme", "السمة"))}
              </button>
            ))}
          </div>
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 max-xl:max-h-80">
            {doc.blocks.map((block, i) => {
              const meta = BLOCK_META[block.type];
              const Icon = meta.icon;
              return (
                <li
                  key={block.id}
                  draggable
                  onDragStart={() => (dragFrom.current = i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const from = dragFrom.current;
                    dragFrom.current = null;
                    if (from === null || from === i) return;
                    const next = [...doc.blocks];
                    const [moved] = next.splice(from, 1);
                    next.splice(i, 0, moved);
                    setBlocks(next);
                  }}
                  onClick={() => select(block.id)}
                  className={cn(
                    "group flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors",
                    selectedId === block.id && panel === "blocks" ? "bg-brand/15" : "hover:bg-panel-2",
                    !block.visible && "opacity-45",
                  )}
                >
                  <GripVertical size={14} className="shrink-0 cursor-grab text-muted/60" />
                  <Icon size={15} className="shrink-0 text-brand" />
                  <span className="min-w-0 flex-1 truncate">{tx(meta.name)}</span>
                  <span className="hidden items-center group-hover:flex">
                    <IconBtn label="up" onClick={() => move(i, -1)}>
                      <ArrowUp size={12} />
                    </IconBtn>
                    <IconBtn label="down" onClick={() => move(i, 1)}>
                      <ArrowDown size={12} />
                    </IconBtn>
                    <IconBtn
                      label="duplicate"
                      onClick={() => {
                        const copy = { ...structuredClone(block), id: newId() };
                        setBlocks([...doc.blocks.slice(0, i + 1), copy, ...doc.blocks.slice(i + 1)]);
                        setSelectedId(copy.id);
                      }}
                    >
                      <Copy size={12} />
                    </IconBtn>
                    <IconBtn
                      label="delete"
                      danger
                      onClick={() => {
                        setBlocks(doc.blocks.filter((b) => b.id !== block.id));
                        if (selectedId === block.id) setSelectedId(null);
                      }}
                    >
                      <Trash2 size={12} />
                    </IconBtn>
                  </span>
                  <IconBtn label="visibility" onClick={() => updateBlock({ ...block, visible: !block.visible } as Block)}>
                    {block.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </IconBtn>
                </li>
              );
            })}
          </ul>
          <div className="shrink-0 border-t border-line p-2">
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-cream hover:bg-gold-hi hover:text-ink"
            >
              <Plus size={15} />
              {tx(tri("Ajouter un bloc", "Add a block", "إضافة قسم"))}
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------ settings */}
        <div className="min-h-0 overflow-y-auto rounded-2xl max-xl:max-h-[70vh] xl:pe-1">
          {panel === "theme" ? (
            <ThemePanel theme={doc.theme} onChange={(theme) => commit({ ...doc, theme })} />
          ) : selected ? (
            <BlockSettings key={selected.id} block={selected} onChange={updateBlock} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              {tx(tri("Sélectionnez un bloc à modifier.", "Select a block to edit.", "اختر قسماً لتعديله."))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------- preview */}
        <div className="min-h-[70vh] xl:min-h-0">{preview}</div>
      </div>

      {/* ------------------------------------------------- add-block picker */}
      {adding && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-shade/60 p-4 backdrop-blur-sm" onClick={() => setAdding(false)}>
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-line bg-panel p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-2xl">{tx(tri("Ajouter un bloc", "Add a block", "إضافة قسم"))}</h3>
              <IconBtn label="close" onClick={() => setAdding(false)}>
                <X size={18} />
              </IconBtn>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BLOCK_TYPES.map((type) => {
                const meta = BLOCK_META[type];
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addBlock(type)}
                    className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 text-start transition-all hover:-translate-y-0.5 hover:border-brand"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand transition-transform group-hover:scale-110">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{tx(meta.name)}</span>
                      <span className="mt-0.5 block text-xs text-muted">{tx(meta.desc)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </EditLangContext.Provider>
  );
}
