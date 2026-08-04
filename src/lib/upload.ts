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
