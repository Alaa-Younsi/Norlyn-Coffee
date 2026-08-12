import { useCallback, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { CapsuleModel } from "./CapsuleModel";
import { CupModel } from "./CupModel";
import { MachineModel } from "./MachineModel";
import { MorphSlot } from "./MorphSlot";
import { AromaSwirl, BeanBurst, CremaShockwave, MorphVortex, Steam3D } from "./MorphFX";
import { Beans } from "./Beans";
import { GoldDust } from "./GoldDust";
import { computeSceneState } from "./sceneConfig";
import { mulberry32 } from "@/lib/random";
import { lerp } from "@/lib/utils";
import { sceneBounds, scrollProgress } from "@/lib/scrollProgress";

interface SceneProps {
  /** variant accent colors, in showcase order (hero starts on the first) */
  colors: string[];
  dirSign: 1 | -1;
  /** phone layout: object parks at the top of the viewport, lighter effects */
  compact: boolean;
  /** fired once the canvas has genuinely drawn — see <FirstFrame> */
  onFirstFrame?: () => void;
}

/**
 * Says "the cup is on screen", and means it.
 *
 * The chunk resolving does not mean the object is visible, and neither does
 * <Canvas> mounting: the renderer still has to compile the physical material's
 * shaders and upload the geometry, and on a mid-range phone that is a
 * noticeable beat during which the hero has a hole in it. So the signal is
 * taken from inside the frame loop, and on the SECOND frame rather than the
 * first — r3f runs its useFrame subscribers before it renders, so frame one
 * fires while the canvas is still blank.
 */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (frames.current > 1) return;
    frames.current += 1;
    if (frames.current > 1) onReady();
  });
  return null;
}

/**
 * One object, four forms. The rig moves and rotates a single group while the
 * three models inside it cross-dissolve on scroll — espresso cup → Moriva
 * capsule → espresso machine → gone. See sceneConfig for the choreography.
 */
function Rig({ colors, dirSign, compact }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const targetColor = useRef(new THREE.Color(colors[0]));
  const colorA = useRef(new THREE.Color());
  const colorB = useRef(new THREE.Color());

  // per-act drive values, read by the slots and FX in their own useFrame
  const cupWeight = useRef(1);
  const capsuleWeight = useRef(0);
  const machineWeight = useRef(0);
  const energy = useRef(0);
  const pour = useRef(0);
  // the shared plume rises off the cup's crema; the machine brews with its
  // own steam positioned at its little cup (inside MachineModel)
  const steamWeight = useRef(1);
  // last value written to the canvas' inline opacity — see the fade below
  const fadeWritten = useRef(-1);

  // How fast the rig chases its scroll target, as a per-second rate rather
  // than a per-frame fraction (see the damping note below). Phones get a
  // stiffer spring: their scroll is native and the object has to sit ON the
  // finger, not trail a fifth of a second behind it.
  const followRate = compact ? 11 : 5;

  useFrame(({ clock, gl, pointer }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = computeSceneState(
      scrollProgress.current,
      dirSign,
      colors.length,
      sceneBounds,
      compact,
    );
    // Every transform below is damped toward its target, and damping never
    // recovers from a bad target: `pos += (NaN - pos) * damp` leaves NaN in the
    // matrix for every later frame, which drops the whole object — models, FX
    // and all — until the page is reloaded. Hold the last good pose instead.
    // (Summing is enough: NaN or ±Infinity anywhere makes the sum non-finite.)
    if (
      !Number.isFinite(state.x + state.y + state.scale + state.stretch) ||
      !Number.isFinite(state.rotY + state.rotZ + state.tilt)
    ) {
      return;
    }

    // `delta * rate` is a per-FRAME fraction, so how far the object catches up
    // per second depends on the frame rate: at 120fps it converges in ~0.2s, at
    // the 40-ish fps a mid-range phone gives this scene it converges in ~0.5s
    // and reads as the object skating behind the scroll. The exponential form
    // is the same curve sampled correctly — identical at 60fps, unchanged on
    // desktop, and now frame-rate independent. A dropped frame or a backgrounded
    // tab must not teleport it either, so the step is capped at 1/20s.
    const damp = 1 - Math.exp(-followRate * Math.min(delta, 0.05));

    group.position.x += (state.x - group.position.x) * damp;
    // the idle bob is a slow breath on desktop; on a phone the object is the
    // one thing centred on screen, and ±13px of drift reads as badly placed
    // rather than alive, so it breathes about a third as far
    const bob = Math.sin(clock.elapsedTime * 0.9) * (compact ? 0.022 : 0.06);
    group.position.y += (state.y + bob - group.position.y) * damp;

    // squash-and-stretch through a morph: the object pinches in, then springs
    // back out as the new form settles
    const scale = group.scale.x + (state.scale - group.scale.x) * damp;
    group.scale.set(scale, scale * state.stretch, scale);

    // Pointer parallax rides on top of the scroll choreography (0 on touch).
    // The idle motion blends from a continuous turn — right for a cup or a
    // capsule, which read from any angle — to a slow sway once the machine has
    // formed, so it stays facing the camera instead of presenting its back.
    const idle = lerp(
      Math.sin(clock.elapsedTime * 0.35) * 0.3,
      clock.elapsedTime * 0.28,
      state.spin,
    );
    group.rotation.y += (state.rotY + idle + pointer.x * 0.3 - group.rotation.y) * damp;
    group.rotation.x += (state.tilt + pointer.y * -0.14 - group.rotation.x) * damp;
    group.rotation.z += (state.rotZ - group.rotation.z) * damp;

    cupWeight.current = state.cupWeight;
    capsuleWeight.current = state.capsuleWeight;
    machineWeight.current = state.machineWeight;
    energy.current = state.energy;
    pour.current = state.pour;
    steamWeight.current = state.cupWeight;

    const material = materialRef.current;
    if (material) {
      const idx = Math.floor(state.colorPos);
      const frac = state.colorPos - idx;
      colorA.current.set(colors[idx]);
      colorB.current.set(colors[Math.min(idx + 1, colors.length - 1)]);
      targetColor.current.copy(colorA.current).lerp(colorB.current, frac);
      material.color.lerp(targetColor.current, 1 - Math.exp(-6 * Math.min(delta, 0.05)));
    }

    // `fade` is 1 for all but the last half-percent of the stage. Writing the
    // inline style anyway dirties the canvas' style every single frame, which
    // on a phone is a style recalc the scene never needed.
    if (state.fade !== fadeWritten.current) {
      gl.domElement.style.opacity = state.fade.toFixed(3);
      fadeWritten.current = state.fade;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      <MorphSlot weight={cupWeight}>
        <CupModel />
      </MorphSlot>
      <MorphSlot weight={capsuleWeight}>
        <CapsuleModel materialRef={materialRef} initialColor={colors[0]} />
      </MorphSlot>
      <MorphSlot weight={machineWeight}>
        <MachineModel pourRef={pour} compact={compact} />
      </MorphSlot>

      {/* transformation FX — only visible while a morph is in flight */}
      <BeanBurst energy={energy} count={compact ? 10 : 22} />
      <MorphVortex energy={energy} count={compact ? 36 : 90} />
      <CremaShockwave energy={energy} />

      {/* ambient coffee FX that follow the object around */}
      <Steam3D weight={steamWeight} count={compact ? 12 : 26} />
      <AromaSwirl count={compact ? 20 : 60} />
      <OrbitBeans count={compact ? 3 : 5} />
      <Sparkles
        count={compact ? 10 : 26}
        scale={2.6}
        size={2.4}
        speed={0.3}
        noise={0.5}
        color="#e8c580"
        opacity={0.55}
      />
    </group>
  );
}

/** A few coffee beans in slow elliptical orbit around the object. */
function OrbitBeans({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(() => {
    const rng = mulberry32(23);
    return Array.from({ length: count }, () => ({
      radius: 1.2 + rng() * 0.45,
      tilt: (rng() - 0.5) * 0.9,
      speed: 0.22 + rng() * 0.25,
      phase: rng() * Math.PI * 2,
      scale: 0.09 + rng() * 0.05,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    seeds.forEach((seed, i) => {
      const a = seed.phase + t * seed.speed;
      dummy.position.set(
        Math.cos(a) * seed.radius,
        Math.sin(a) * seed.radius * seed.tilt,
        Math.sin(a) * seed.radius * 0.6,
      );
      dummy.rotation.set(t * 0.5 + seed.phase, t * 0.6, seed.phase);
      dummy.scale.set(seed.scale, seed.scale * 0.62, seed.scale * 0.8);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={count}
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial color="#4a2b17" roughness={0.45} metalness={0.2} />
    </instancedMesh>
  );
}

/**
 * Phones range from a 2019 budget Android to a current iPhone, and the right
 * render resolution differs by a factor of four between them. A fixed cap has
 * to be set for the slow end, which is why the object looked soft next to the
 * crisp DOM text around it: it was drawn at ~55% of the screen's linear
 * resolution and upscaled. So the cap is measured instead — start at the
 * conservative value, climb to native (where the gold filet on the cup's lip
 * finally resolves) on a device that holds its refresh rate, and drop back if
 * it cannot. `flipflops` stops the probing after a few reversals so the canvas
 * is not being resized forever, and `onFallback` pins the safe value.
 */
/**
 * The rungs the compact canvas climbs, softest first. It used to be a pair —
 * a "safe" value and native — and a device that could not quite hold native
 * fell all the way to 1.0 on a 2.75x screen, which is the muddy look: the
 * scene drawn at a third of the resolution of the text beside it. A ladder
 * moves ONE rung at a time, so a phone that is merely close to its budget
 * settles at 1.6 instead of bottoming out, and 1.25 is the floor rather than 1.
 */
const COMPACT_DPR = [1.25, 1.6, 2] as const;
/** where a phone starts before the monitor has an opinion — one rung down from native */
const COMPACT_START = 1;

export function Scene({ colors, dirSign, compact, onFirstFrame }: SceneProps) {
  // never render ABOVE the screen's own pixel density — that is pure
  // supersampling the visitor pays for and cannot see
  const ladder = useMemo(() => {
    const density = window.devicePixelRatio || 1;
    const rungs = COMPACT_DPR.filter((rung) => rung <= density);
    return rungs.length > 0 ? rungs : [density];
  }, []);
  const [rung, setRung] = useState(() => Math.min(COMPACT_START, ladder.length - 1));
  const dpr = ladder[rung];

  // `flipflops` on the monitor caps how many times these can reverse, so a
  // device that sits exactly on the boundary stops being resized forever
  const onIncline = useCallback(
    () => setRung((r) => Math.min(r + 1, ladder.length - 1)),
    [ladder.length],
  );
  const onDecline = useCallback(() => setRung((r) => Math.max(r - 1, 0)), []);

  return (
    <Canvas
      dpr={compact ? dpr : [1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      // MSAA is on everywhere now. It used to be a desktop luxury, but the
      // cup's gold filet is a sub-pixel-thin torus and without it the lip and
      // the saucer brim render as a dashed brown line rather than a drawn one —
      // the single most "cheap 3D" thing on the phone screen. Mobile GPUs are
      // tile-based, where multisampling resolves inside tile memory and costs a
      // fraction of what the same quality would cost as extra resolution, and
      // the adaptive dpr above is the safety valve if a device still can't hold
      // its frame rate.
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      // events live on <html>, NOT on the canvas: r3f's wrapper otherwise sets
      // pointer-events:auto inline and the full-screen layer swallows every
      // click on the page. This keeps the pointer state (parallax) working
      // while the canvas itself stays click-through.
      eventSource={document.documentElement}
      eventPrefix="client"
      style={{ background: "transparent", pointerEvents: "none" }}
    >
      {compact && (
        <PerformanceMonitor
          flipflops={3}
          onIncline={onIncline}
          onDecline={onDecline}
          onFallback={onDecline}
        />
      )}

      {/* plain-light studio: reliable color rendition, no HDR download */}
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff6e6", "#5b3a22", 0.7]} />
      <directionalLight position={[3, 4, 5]} intensity={2.1} color="#fff2dd" />
      <directionalLight position={[-4, 2, -3]} intensity={0.8} color="#dfe6ff" />
      <pointLight position={[0, -2, 3]} intensity={0.7} color="#e8c580" />

      {onFirstFrame && <FirstFrame onReady={onFirstFrame} />}

      <Rig colors={colors} dirSign={dirSign} compact={compact} />
      <Beans count={compact ? 8 : 14} />
      <GoldDust count={compact ? 70 : 140} />
    </Canvas>
  );
}
