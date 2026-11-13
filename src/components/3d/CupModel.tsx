import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Act 1: a clear glass espresso cup on its porcelain saucer — the shape the
 * scroll story starts from before it transforms into the Moriva capsule.
 *
 * The body is one continuous lathe: up the footed base, out through a tulip
 * curve, over a rolled lip and back down the inside, so the cup is genuinely
 * hollow with visible wall thickness. The handle is a tube swept along a
 * curve whose both ends are buried inside the wall — it reads as blown into
 * the glass instead of a ring floating next to it.
 *
 * The glass is FAKED, not refracted: the scene has no environment map, so a
 * transmission material would render as flat grey. Instead the glass is a
 * barely-there tint whose alpha and brightness climb toward grazing angles (a
 * Fresnel rim, injected in makeGlass) — which is how real glass reads:
 * invisible face-on, bright at the silhouette. Through it you see the shot
 * itself: a near-black espresso body under a thick caramel crema, like the
 * brand photo.
 */

// (radius, height) — outside up, over the lip, back down the inside.
// A demitasse silhouette: narrow foot, generous rounded belly, then a
// near-vertical upper wall to the lip — not a straight cone.
const CUP_PROFILE: Array<[number, number]> = [
  [0.001, -0.6],
  [0.18, -0.6],
  [0.24, -0.585],
  [0.255, -0.55],
  [0.24, -0.53],
  [0.27, -0.46],
  [0.36, -0.34],
  [0.45, -0.18],
  [0.5, -0.04],
  [0.522, 0.06],
  [0.53, 0.13],
  [0.535, 0.185],
  [0.542, 0.198],
  [0.528, 0.207],
  [0.512, 0.194],
  [0.502, 0.1],
  [0.49, -0.02],
  [0.462, -0.16],
  [0.38, -0.32],
  [0.3, -0.41],
  [0.26, -0.45],
  [0.001, -0.46],
];

/** The inside of the cup, lip → floor (the tail of CUP_PROFILE). */
const INNER_WALL = CUP_PROFILE.slice(14);

// saucer: footed underside, shallow well, wide brim with an upturned edge
const SAUCER_PROFILE: Array<[number, number]> = [
  [0.001, -0.72],
  [0.28, -0.72],
  [0.33, -0.7],
  [0.32, -0.665],
  [0.42, -0.655],
  [0.66, -0.605],
  [0.88, -0.55],
  [0.93, -0.52],
  [0.918, -0.507],
  [0.87, -0.528],
  [0.64, -0.582],
  [0.4, -0.632],
  [0.001, -0.64],
];

// The liquid line and crema thickness, in the profiles' units. The crema is
// about a quarter of the shot, as in a freshly pulled espresso.
const SURFACE_Y = 0.07;
const CREMA_DEPTH = 0.1;
const FLOOR_Y = -0.455;
// a hair inside the glass so the liquid never z-fights the inner wall
const WALL_GAP = 0.008;

const PORCELAIN = {
  color: "#fdfaf4",
  metalness: 0.03,
  roughness: 0.14,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
} as const;

export function CupModel() {
  const cupGeometry = useMemo(() => lathe(CUP_PROFILE, 96), []);
  const saucerGeometry = useMemo(() => lathe(SAUCER_PROFILE, 96), []);

  // handle: swept tube, both end points sit inside the cup wall
  const handleGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, 0.08, 0),
      new THREE.Vector3(0.68, 0.02, 0),
      new THREE.Vector3(0.73, -0.12, 0),
      new THREE.Vector3(0.64, -0.27, 0),
      new THREE.Vector3(0.38, -0.34, 0),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.05, 16, false);
  }, []);

  // the espresso body below the crema, and the crema band itself — both
  // follow the glass's inner curve so the shot is shaped by the cup
  const espressoGeometry = useMemo(
    () => lathe([[0.001, FLOOR_Y], ...liquidProfile(FLOOR_Y, SURFACE_Y - CREMA_DEPTH, 14)], 96),
    [],
  );
  const cremaBandGeometry = useMemo(
    () => lathe(liquidProfile(SURFACE_Y - CREMA_DEPTH, SURFACE_Y, 6), 96),
    [],
  );
  const surfaceRadius = innerRadiusAt(SURFACE_Y) - WALL_GAP;

  const cremaTextures = useMemo(() => buildCremaTextures(), []);

  const porcelain = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        ...PORCELAIN,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    [],
  );

  // the handle is a solid rod, so its edges read a little more substantial
  const glass = useMemo(() => makeGlass(0.05, 12), []);
  const glassHandle = useMemo(() => makeGlass(0.42, 1.8), []);

  /*
    Glass is only as visible as what it reflects, and this scene has nothing
    to reflect — so the handle in particular read as barely there. The glass
    (and ONLY the glass: every other material keeps the look it was tuned for)
    gets a small procedural studio, RoomEnvironment pre-filtered through PMREM.
    Built in code, nothing downloaded, disposed with the cup.
  */
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    for (const material of [glass, glassHandle]) {
      material.envMap = env;
      material.envMapIntensity = 1.35;
      material.needsUpdate = true;
    }
    return () => {
      for (const material of [glass, glassHandle]) material.envMap = null;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, glass, glassHandle]);

  const espresso = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        // Near-black with a TIGHT highlight: a broad clearcoat lobe under
        // this scene's strong key light smeared grey across the whole belly
        // and the shot read as milky. Liquid behind glass is a dark mirror.
        color: "#030100",
        roughness: 0.1,
        metalness: 0,
        specularIntensity: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    [],
  );

  const cremaBand = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: cremaTextures?.band ?? null,
        color: cremaTextures ? "#ffffff" : "#b9773a",
        side: THREE.DoubleSide,
        roughness: 0.62,
        metalness: 0,
        transparent: true,
      }),
    [cremaTextures],
  );

  const cremaTop = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: cremaTextures?.top ?? null,
        color: cremaTextures ? "#ffffff" : "#c88a4a",
        roughness: 0.55,
        metalness: 0,
        clearcoat: 0.35,
        clearcoatRoughness: 0.4,
        transparent: true,
      }),
    [cremaTextures],
  );

  const goldTrim = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c99a45",
        metalness: 0.88,
        roughness: 0.2,
        clearcoat: 0.8,
        clearcoatRoughness: 0.15,
        transparent: true,
      }),
    [],
  );

  return (
    <group>
      <mesh geometry={saucerGeometry} material={porcelain} />

      {/* the shot — drawn BEFORE the glass (renderOrder) so the glass's rim
          light lands on top of it, as it would in life */}
      <mesh geometry={espressoGeometry} material={espresso} renderOrder={1} castShadow />
      <mesh geometry={cremaBandGeometry} material={cremaBand} renderOrder={1} />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, SURFACE_Y, 0]}
        material={cremaTop}
        renderOrder={1}
      >
        <circleGeometry args={[surfaceRadius, 96]} />
      </mesh>

      <mesh geometry={cupGeometry} material={glass} renderOrder={2} />
      <mesh geometry={handleGeometry} material={glassHandle} renderOrder={2} />

      {/* gold filet at the lip, on the foot, and around the saucer brim */}
      <mesh material={goldTrim} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.186, 0]}>
        <torusGeometry args={[0.527, 0.009, 10, 96]} />
      </mesh>
      <mesh material={goldTrim} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.552, 0]}>
        <torusGeometry args={[0.248, 0.007, 8, 64]} />
      </mesh>
      <mesh material={goldTrim} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.517, 0]}>
        <torusGeometry args={[0.9, 0.008, 8, 96]} />
      </mesh>
      {/* thin gold ring around the saucer well, framing the cup's foot */}
      <mesh material={goldTrim} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.652, 0]}>
        <torusGeometry args={[0.37, 0.006, 8, 64]} />
      </mesh>
    </group>
  );
}

/** Inner wall radius at height y, interpolated along INNER_WALL. */
function innerRadiusAt(y: number): number {
  for (let i = 0; i < INNER_WALL.length - 1; i++) {
    const [r0, y0] = INNER_WALL[i];
    const [r1, y1] = INNER_WALL[i + 1];
    if (y <= y0 && y >= y1) {
      return r0 + ((r1 - r0) * (y0 - y)) / (y0 - y1);
    }
  }
  return INNER_WALL[INNER_WALL.length - 2][0];
}

/** A lathe profile hugging the inner wall from yBottom up to yTop. */
function liquidProfile(yBottom: number, yTop: number, steps: number): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const y = yBottom + ((yTop - yBottom) * i) / steps;
    points.push([Math.max(0.001, innerRadiusAt(y) - WALL_GAP), y]);
  }
  return points;
}

/**
 * Fresnel glass: alpha and a soft highlight rise toward the silhouette.
 * `diffuseColor.a` already carries `opacity`, which MorphSlot scales with the
 * act's weight — so the rim fades with the cross-dissolve like everything else.
 */
function makeGlass(opacity: number, rim: number): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 0,
    roughness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    opacity,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  // MorphSlot owns depthWrite on every material; glass must never write it,
  // or the front wall would hide the coffee behind it
  material.userData.noDepthWrite = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: rim };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float uRim;\nvoid main() {")
      .replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        float glassFacing = abs(dot(normalize(normal), normalize(vViewPosition)));
        float glassFresnel = pow(1.0 - glassFacing, 2.6);
        // on the dark (espresso) page glass reads by its BRIGHT edges: a warm
        // rim light at grazing angles, on top of the env reflections
        gl_FragColor.rgb += vec3(0.95, 0.86, 0.72) * glassFresnel * 0.55;
        gl_FragColor.a = min(1.0, diffuseColor.a * (1.0 + glassFresnel * uRim));`,
      );
  };
  // distinct key per rim: a shared program would skip onBeforeCompile for
  // the second material and leave its uRim uniform unset
  material.customProgramCacheKey = () => `moriva-glass-${rim}`;
  return material;
}

/**
 * Two canvas textures for the crema:
 *  - top: a mottled hazelnut disc, paler at the centre and deepening to
 *    tiger-flecked amber toward the glass, the way a real crema settles;
 *  - band: the crema seen THROUGH the glass from the side — a dense caramel
 *    layer that darkens into the espresso at its bottom edge.
 * Seeded noise, not Math.random, so every render of the cup is identical.
 */
function buildCremaTextures(): { top: THREE.CanvasTexture; band: THREE.CanvasTexture } | null {
  const size = 512;
  const top = document.createElement("canvas");
  top.width = top.height = size;
  const tctx = top.getContext("2d");
  const band = document.createElement("canvas");
  band.width = 512;
  band.height = 64;
  const bctx = band.getContext("2d");
  if (!tctx || !bctx) return null;

  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const c = size / 2;
  const base = tctx.createRadialGradient(c, c, 0, c, c, c);
  base.addColorStop(0, "#dca064");
  base.addColorStop(0.45, "#cf8a45");
  base.addColorStop(0.8, "#bd7434");
  base.addColorStop(0.93, "#a35f28");
  base.addColorStop(1, "#6e3c1a");
  tctx.fillStyle = base;
  tctx.fillRect(0, 0, size, size);

  // fine micro-foam speckle
  for (let i = 0; i < 9000; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * c;
    tctx.fillStyle = rand() > 0.5 ? "rgba(240,200,150,0.18)" : "rgba(90,45,15,0.16)";
    tctx.beginPath();
    tctx.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 0.6 + rand() * 1.6, 0, Math.PI * 2);
    tctx.fill();
  }
  // soft darker flecks drifting around the outer half
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2;
    const r = c * (0.45 + rand() * 0.48);
    tctx.save();
    tctx.translate(c + Math.cos(a) * r, c + Math.sin(a) * r);
    tctx.rotate(a + Math.PI / 2);
    tctx.fillStyle = "rgba(110,58,22,0.14)";
    tctx.beginPath();
    tctx.ellipse(0, 0, 10 + rand() * 26, 2 + rand() * 4, 0, 0, Math.PI * 2);
    tctx.fill();
    tctx.restore();
  }
  // meniscus: the crema climbs and darkens where it meets the glass
  const rim = tctx.createRadialGradient(c, c, c * 0.9, c, c, c);
  rim.addColorStop(0, "rgba(232,190,130,0)");
  rim.addColorStop(0.75, "rgba(232,190,130,0.35)");
  rim.addColorStop(1, "rgba(120,66,28,0.6)");
  tctx.fillStyle = rim;
  tctx.fillRect(0, 0, size, size);

  // band: lathe v runs bottom (0) → surface (1), and canvas row 0 maps to
  // v=1 (flipY), so the canvas TOP is the crema's surface
  const vertical = bctx.createLinearGradient(0, 64, 0, 0);
  vertical.addColorStop(0, "#3a1a08");
  vertical.addColorStop(0.07, "#a35f26");
  vertical.addColorStop(0.3, "#c47a36");
  vertical.addColorStop(0.8, "#d8944e");
  vertical.addColorStop(1, "#e2a462");
  bctx.fillStyle = vertical;
  bctx.fillRect(0, 0, 512, 64);
  for (let i = 0; i < 1800; i++) {
    bctx.fillStyle = rand() > 0.5 ? "rgba(245,205,155,0.16)" : "rgba(80,40,12,0.14)";
    bctx.fillRect(rand() * 512, rand() * 54, 1 + rand() * 2, 1);
  }

  const topTexture = new THREE.CanvasTexture(top);
  topTexture.colorSpace = THREE.SRGBColorSpace;
  topTexture.anisotropy = 4;
  const bandTexture = new THREE.CanvasTexture(band);
  bandTexture.colorSpace = THREE.SRGBColorSpace;
  bandTexture.wrapS = THREE.RepeatWrapping;
  return { top: topTexture, band: bandTexture };
}

function lathe(profile: Array<[number, number]>, segments: number): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}
