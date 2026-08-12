import { Smartphone } from "lucide-react";
import { IN_PHONE_FRAME, usePhonePreview } from "./state";

/**
 * TEMPORARY — recording rig. See ./README.md for how to delete it.
 *
 * Styled to match the other header chips so it does not distort the bar it is
 * borrowing space in — the point of the preview is to film the site as it
 * really is, and a button that pushes the logo sideways would change the shot.
 */
export function PhonePreviewButton() {
  const toggle = usePhonePreview((s) => s.toggle);

  // never inside the glass: it would be in the video
  if (IN_PHONE_FRAME) return null;

  return (
    <button
      onClick={toggle}
      className="rounded-full border border-line/70 bg-panel/85 p-2 text-muted transition-colors hover:text-ink cursor-pointer"
      aria-label="Phone preview"
      title="Phone preview — temporary recording tool"
    >
      <Smartphone size={17} />
    </button>
  );
}
