/**
 * Asset pipeline, moving pictures: the client's raw films live in
 * `assets-src/raw/videos/` (never deployed, gitignored beside the raw photos).
 * This turns them into the small H.264 MP4 the storefront actually ships from
 * `public/videos/` — at the exact filenames `lib/videoSlots.ts` reads, which is
 * the whole contract. A file at any other name is a file nothing plays.
 *
 * Run: node scripts/optimize-videos.mjs   (idempotent — safe to re-run)
 *
 * Needs ffmpeg on PATH. Everything below is one `ffmpeg` invocation per film;
 * the interesting part is the recipes, not the plumbing.
 *
 * Why one MP4 per slot and not a WebM/AV1 sibling: both players take a single
 * `src` attribute rather than <source> children, so a second encode would be a
 * file nobody requests. H.264 High is the one codec every phone that reaches
 * this store decodes in hardware, which matters more than a smaller file that
 * costs battery to play.
 */
import { spawn } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const RAW = "assets-src/raw/videos";
const OUT = "public/videos";

/**
 * The frames these films play in, in device pixels — the CSS box each slot
 * reserves at its widest (`sizes` in the components) times 2 for a retina
 * phone. Nothing is ever upscaled past its source: a box is a ceiling, not a
 * target.
 *
 * Both players use `object-cover`, so the browser crops to the frame at paint
 * time. We therefore scale to COVER the box and never crop here — cropping the
 * client's footage is a framing decision, and it belongs to whoever shot it.
 */
const RECIPES = [
  {
    in: "hero-video.mp4",
    out: "hero.mp4",
    /** the vertical screen beside the home page title, aspect 4/5 */
    box: [1080, 1350],
    /*
      The hero is the one film a visitor actually looks at, and HeroVideo gives
      it an unmute button — so it is allowed to keep sound, and gets the lower
      CRF. "Allowed" and not "does": the masters delivered so far carry a track
      that measures -91 dB, i.e. digital silence, and `isSilent` drops those.
    */
    crf: 21,
    maxrate: "3000k",
    audio: true,
  },
  {
    in: "standard-video.mp4",
    out: "espresso.mp4",
    /** the loop beside the buy form on every product page, aspect 4/3 */
    box: [1280, 960],
    /*
      EspressoLoop is scenery: aria-hidden, pointer-events-none, muted forever
      with no control to unmute. An audio track here is bytes that can never be
      heard, so it is dropped outright.
    */
    crf: 23,
    maxrate: "2400k",
    audio: false,
  },
];

/**
 * Frame ceiling, whatever the slot. Nothing here is sport or action; 60fps on a
 * cup of coffee is roughly double the bytes for motion no one perceives.
 */
const MAX_FPS = 30;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => (out += chunk));
    child.stderr.on("data", (chunk) => (err += chunk));
    child.on("error", reject);
    // ffmpeg says everything it has to say on stderr — its measurements as much
    // as its errors — so both streams come back and the caller picks
    child.on("close", (code) =>
      code === 0
        ? resolve({ stdout: out, stderr: err })
        : reject(new Error(`${command} exited ${code}\n${err.slice(-2000)}`)),
    );
  });
}

/** width, height, fps and "is there sound in here" for one file. */
async function probe(file) {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration",
    "-of", "json",
    file,
  ]);
  const { streams, format } = JSON.parse(stdout);
  const video = streams.find((stream) => stream.codec_type === "video");
  if (!video) throw new Error(`${file} has no video stream`);
  const [numerator, denominator] = String(video.r_frame_rate).split("/");
  return {
    width: video.width,
    height: video.height,
    fps: Number(numerator) / Number(denominator || 1),
    hasAudio: streams.some((stream) => stream.codec_type === "audio"),
    duration: Number(format?.duration ?? 0),
  };
}

/**
 * Is this track worth carrying? An editor's timeline export usually ships a
 * track of pure silence, and re-encoding that is ~1 KB/s of AAC plus a decoder
 * the phone has to spin up for nothing. -60 dB is far below anything audible
 * but comfortably above the noise floor of a real quiet recording, so a room
 * tone the client actually wanted survives this test.
 */
async function isSilent(file) {
  try {
    const { stderr } = await run("ffmpeg", [
      "-hide_banner", "-i", file, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-",
    ]);
    const peak = /max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/.exec(stderr);
    // no reading at all: say nothing, keep the track, let the ears decide
    return peak ? Number(peak[1]) < -60 : false;
  } catch {
    return false;
  }
}

/**
 * The smallest size that still fills `box` completely, never larger than the
 * source. H.264 wants even dimensions on both axes, hence the rounding.
 */
function coverSize({ width, height }, [boxWidth, boxHeight]) {
  const scale = Math.min(1, Math.max(boxWidth / width, boxHeight / height));
  const even = (value) => Math.max(2, Math.round((value * scale) / 2) * 2);
  return [even(width), even(height)];
}

async function encode(recipe) {
  const source = path.join(RAW, recipe.in);
  const target = path.join(OUT, recipe.out);

  const info = await probe(source);
  const [width, height] = coverSize(info, recipe.box);
  const fps = Math.min(info.fps || MAX_FPS, MAX_FPS);
  const keepAudio = recipe.audio && info.hasAudio && !(await isSilent(source));

  const filters = [`scale=${width}:${height}:flags=lanczos`, `fps=${fps.toFixed(3)}`];

  const args = [
    "-y",
    "-i", source,
    "-vf", filters.join(","),
    "-c:v", "libx264",
    "-profile:v", "high",
    "-level:v", "4.0",
    "-preset", "veryslow",
    "-crf", String(recipe.crf),
    // CRF alone lets a busy shot spike into a stall on a phone; the cap only
    // bites on those frames and leaves the quiet ones at full quality
    "-maxrate", recipe.maxrate,
    "-bufsize", `${Number.parseInt(recipe.maxrate, 10) * 2}k`,
    // 8-bit 4:2:0 is what every hardware decoder wants; anything else falls
    // back to software on Safari and burns the phone's battery
    "-pix_fmt", "yuv420p",
    // the loops start playing before the file is done downloading, which only
    // works if the index sits at the front
    "-movflags", "+faststart",
  ];

  if (keepAudio) args.push("-c:a", "aac", "-b:a", "96k", "-ac", "2", "-ar", "48000");
  else args.push("-an");

  args.push(target);
  await run("ffmpeg", args);

  const [before, after] = await Promise.all([stat(source), stat(target)]);
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
  const saved = Math.round((1 - after.size / before.size) * 100);
  console.log(
    `${recipe.in} → ${recipe.out}  ${info.width}x${info.height} → ${width}x${height}` +
      `  ${mb(before.size)} MB → ${mb(after.size)} MB (−${saved}%)` +
      `  ${info.duration.toFixed(1)}s @ ${fps.toFixed(0)}fps${keepAudio ? " +audio" : " silent"}`,
  );
}

await mkdir(OUT, { recursive: true });
for (const recipe of RECIPES) {
  await encode(recipe);
}
