import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image";

/**
 * Supabase has no free image transformation: whatever lands in the bucket is
 * exactly what every shopper downloads. Compress first, and cache for a year —
 * the default is 1 hour and these paths carry a UUID, so they're immutable.
 */
const ONE_YEAR = "31536000";

export async function uploadImage(file: File, prefix: string): Promise<string> {
  const blob = await compressImage(file);
  const ext = blob.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, blob, { cacheControl: ONE_YEAR, contentType: blob.type });
  if (error) throw error;

  return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
}

/**
 * Delete the bucket object behind a public URL.
 *
 * Removing the row that points at a photo does not remove the photo: the file
 * keeps sitting in the bucket, unreachable and still counted against the
 * project's storage. A client who re-shoots their catalogue twice fills the
 * free tier with images nobody can ever see again.
 *
 * Best-effort by design. The database row is the source of truth, so a failed
 * cleanup must never block or reverse the delete the admin actually asked for —
 * an orphaned file is a cost, a half-deleted product is a bug. Returns whether
 * the object went, for callers that want to know.
 */
export async function deleteUploadedImage(publicUrl: string): Promise<boolean> {
  const path = storagePathFromPublicUrl(publicUrl, "product-images");
  if (!path) return false;
  const { error } = await supabase.storage.from("product-images").remove([path]);
  return !error;
}

/**
 * Public URLs look like `…/storage/v1/object/public/<bucket>/<path>`. Anything
 * that doesn't (a pasted external URL, one of the seeded `/images/…` paths)
 * returns null — those are not ours to delete.
 */
function storagePathFromPublicUrl(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const at = url.indexOf(marker);
  if (at === -1) return null;
  const path = url.slice(at + marker.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

/**
 * Videos go to their own bucket, but every form ALSO accepts a pasted URL —
 * the <video> player only needs one, so the client can move hosting to
 * Cloudinary/Bunny without a code change when Supabase egress (~5 GB/month,
 * shared with everything) becomes the constraint.
 */
export async function uploadVideo(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "mp4";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-videos")
    .upload(path, file, { cacheControl: ONE_YEAR, contentType: file.type });
  if (error) throw error;

  return supabase.storage.from("product-videos").getPublicUrl(path).data.publicUrl;
}
