import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// A phone's URL bar slides away on the first scroll down and slides back on the
// first scroll up, and each slide is a viewport resize. By default that makes
// ScrollTrigger re-measure every trigger on the page — mid-flick, while the 3D
// object is mid-move and the reveal animations are running. That re-measure is
// the hitch phones show and desktops never do. Nothing actually reflowed: the
// change is browser chrome, so there is nothing to re-measure. Width changes
// (a real rotation) still refresh.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }
