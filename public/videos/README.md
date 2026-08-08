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
