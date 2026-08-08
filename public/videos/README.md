# Drop-in films

Two files are read from this folder by name. They are the **fallback** for the
video slots declared in `src/lib/videoSlots.ts` — whatever the client uploads
from **Admin → Contenu & médias → Vidéos** wins over anything here.

| file                    | where it plays                                            |
| ----------------------- | --------------------------------------------------------- |
| `hero.mp4`              | the vertical screen beside the title on the home page      |
| `espresso.mp4`          | the loop beside the order form on **every** product page   |

Commit a file at exactly that path and it appears on the next build. Until one
exists, each slot shows its still photograph instead — a designed state, not a
broken player, so shipping without the films costs the pages nothing.

Keep them small: both autoplay, and most of this store's traffic is a phone on
mobile data. Aim for **under ~8 MB**, H.264/MP4, muted, a few seconds long and
seamless to loop. (Uploads through the admin go to the `product-videos` bucket,
which caps a file at 50 MB — that ceiling is a guard, not a target.)

## Don't hand-encode these

The two files here are **build output**. Put the master in
`assets-src/raw/videos/` — `hero-video.mp4` and `standard-video.mp4`, gitignored
with the raw photography — and run:

```
node scripts/optimize-videos.mjs
```

It writes both files above at the right names, sizes each one to the frame its
slot actually paints, drops a silent audio track rather than re-encoding it, and
moves the index to the front of the file so playback starts before the download
finishes. What currently ships came out at 1.78 MB and 0.50 MB, from 6.14 MB and
2.92 MB of master, measuring VMAF 96 / 94 against them.

Editing the recipes in that script is how these change. Dropping a file straight
into this folder still works — it just ships whatever the camera or the editor
happened to produce, which is where a 6 MB hero comes from.
