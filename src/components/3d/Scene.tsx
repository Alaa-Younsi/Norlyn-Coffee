import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { CapsuleModel } from "./CapsuleModel";
import { Beans } from "./Beans";
import { GoldDust } from "./GoldDust";
import { computeSceneState } from "./sceneConfig";
import { scrollProgress } from "@/lib/scrollProgress";

interface SceneProps {
  /** variant accent colors, in showcase order (hero starts on the first) */
  colors: string[];
  dirSign: 1 | -1;
  /** phone layout: capsule parks at the top of the viewport, lighter effects */
  compact: boolean;
}

function Rig({ colors, dirSign, compact }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const targetColor = useRef(new THREE.Color(colors[0]));
  const colorA = useRef(new THREE.Color());
  const colorB = useRef(new THREE.Color());

  useFrame(({ clock, gl, pointer }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = computeSceneState(scrollProgress.current, dirSign, colors.length, compact);
    const damp = Math.min(1, delta * 5);

    group.position.x += (state.x - group.position.x) * damp;
    group.position.y +=
      (state.y + Math.sin(clock.elapsedTime * 0.9) * 0.06 - group.position.y) * damp;
    const scale = group.scale.x + (state.scale - group.scale.x) * damp;
    group.scale.setScalar(scale);
    // pointer parallax rides on top of the scroll choreography (0 on touch);
    // the base +0.3 tilt leans the faceted crown toward the camera so the
    // capsule reads like the product shots instead of a silhouette
    group.rotation.y +=
      (state.rotY + clock.elapsedTime * 0.28 + pointer.x * 0.3 - group.rotation.y) * damp;
    group.rotation.x += (0.3 + pointer.y * -0.14 - group.rotation.x) * damp;
    group.rotation.z += (state.rotZ - group.rotation.z) * damp;

    const material = materialRef.current;
    if (material) {
      const idx = Math.floor(state.colorPos);
      const frac = state.colorPos - idx;
      colorA.current.set(colors[idx]);
      colorB.current.set(colors[Math.min(idx + 1, colors.length - 1)]);
      targetColor.current.copy(colorA.current).lerp(colorB.current, frac);
      material.color.lerp(targetColor.current, Math.min(1, delta * 6));
    }

    gl.domElement.style.opacity = state.fade.toFixed(3);
  });

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      <CapsuleModel materialRef={materialRef} initialColor={colors[0]} />
      <OrbitBeans count={compact ? 3 : 5} />
      <Sparkles
        count={compact ? 14 : 26}
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

/** A few coffee beans in slow elliptical orbit around the capsule. */
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

export function Scene({ colors, dirSign, compact }: SceneProps) {
  return (
    <Canvas
      dpr={compact ? [1, 1.5] : [1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ alpha: true, antialias: !compact, powerPreference: "high-performance" }}
      // events live on <html>, NOT on the canvas: r3f's wrapper otherwise sets
      // pointer-events:auto inline and the full-screen layer swallows every
      // click on the page. This keeps the pointer state (parallax) working
      // while the canvas itself stays click-through.
      eventSource={document.documentElement}
      eventPrefix="client"
      style={{ background: "transparent", pointerEvents: "none" }}
    >
      {/* plain-light studio: reliable color rendition, no HDR download */}
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff6e6", "#5b3a22", 0.7]} />
      <directionalLight position={[3, 4, 5]} intensity={2.1} color="#fff2dd" />
      <directionalLight position={[-4, 2, -3]} intensity={0.8} color="#dfe6ff" />
      <pointLight position={[0, -2, 3]} intensity={0.7} color="#e8c580" />

      <Rig colors={colors} dirSign={dirSign} compact={compact} />
      <Beans count={compact ? 8 : 14} />
      <GoldDust count={compact ? 70 : 140} />
    </Canvas>
  );
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
