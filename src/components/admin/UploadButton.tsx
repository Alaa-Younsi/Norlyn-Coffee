import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { uploadImage, uploadVideo } from "@/lib/upload";
import { cn } from "@/lib/utils";

/**
 * One upload control for every admin form. Images are compressed before they
 * hit the bucket (see lib/upload.ts); videos are passed through, and every
 * form that uses this also exposes a plain "paste a URL" input so hosting can
 * move off Supabase without a code change.
 */
export function UploadButton({
  kind = "image",
  prefix = "content",
  onUploaded,
  className,
  label,
}: {
  kind?: "image" | "video";
  prefix?: string;
  onUploaded: (url: string) => void;
  className?: string;
  label?: string;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(false);
    try {
      const url = kind === "video" ? await uploadVideo(file) : await uploadImage(file, prefix);
      onUploaded(url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors cursor-pointer hover:border-brand disabled:opacity-50",
        )}
      >
        <Upload size={15} />
        {busy ? t("admin.form.uploading") : (label ?? t("admin.form.upload"))}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={kind === "video" ? "video/*" : "image/*"}
        className="hidden"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      {error && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{t("common.error")}</p>}
    </div>
  );
}
