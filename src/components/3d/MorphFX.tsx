import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/random";
import { softCircleTexture } from "./softCircle";

/**
 * The coffee effects that ride the scroll choreography: a bean burst, a gold
 * vortex and a crema shockwave that fire while one form transforms into the
 * next, steam that rises whenever something hot is on screen, and a slow
 * aroma swirl. All of them read their drive value from a ref so scrolling
 * never re-renders React.
 */

/** Beans flung outward from the object while it changes form. */
export function BeanBurst({ energy, count = 22 }: { energy: RefObject<number>; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo(() => {
    const rng = mulberry32(91);
    return Array.from({ length: count }, () => {
      // even-ish spread over a sphere, biased outward from the equator
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      return {
        dir: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi) * 0.7,
          Math.sin(phi) * Math.sin(theta),
        ),
        distance: 0.9 + rng() * 1.5,
        scale: 0.06 + rng() * 0.055,
        spin: (rng() - 0.5) * 3,
        phase: rng() * Math.PI * 2,
      };
    });
  }, [count]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const e = energy.current ?? 0;
    mesh.visible = e > 0.02;
    if (materialRef.current) materialRef.current.opacity = Math.min(1, e * 1.4);
    if (!mesh.visible) return;

    const t = clock.elapsedTime;
    // ease-out flight so the beans shoot away fast and settle at the edge
    const travel = 1 - Math.pow(1 - e, 2);
    seeds.forEach((seed, i) => {
      const radius = 0.25 + seed.distance * travel;
      dummy.position.copy(seed.dir).multiplyScalar(radius);
      dummy.position.y += Math.sin(t * 1.6 + seed.phase) * 0.06;
      dummy.rotation.set(t * seed.spin, t * seed.spin * 0.7 + seed.phase, seed.phase);
      const s = seed.scale * (0.5 + e * 0.5);
      dummy.scale.set(s, s * 0.6, s * 0.78);
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
      visible={false}
    >
      <sphereGeometry args={[1, 12, 9]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#4a2b17"
        roughness={0.45}
        metalness={0.2}
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  );
}

/** Two crema-colored rings that expand out of the object as it transforms. */
export function CremaShockwave({ energy }: { energy: RefObject<number> }) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerMat = useRef<THREE.MeshBasicMaterial>(null);
  const innerMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const e = energy.current ?? 0;
    const visible = e > 0.02;
    const outer = outerRef.current;
    if (outer && outerMat.current) {
      outer.visible = visible;
      // grows the whole way through the morph, brightest in the middle
      outer.scale.setScalar(0.4 + e * 1.7);
      outerMat.current.opacity = Math.sin(Math.min(1, e) * Math.PI) * 0.35;
    }
    // the inner ring chases the outer one, slightly delayed — the double
    // pulse reads as a shockwave rather than a single expanding decal
    const chase = Math.max(0, e - 0.18) / 0.82;
    const inner = innerRef.current;
    if (inner && innerMat.current) {
      inner.visible = visible && chase > 0.01;
      inner.scale.setScalar(0.3 + chase * 1.5);
      innerMat.current.opacity = Math.sin(Math.min(1, chase) * Math.PI) * 0.25;
    }
  });

  return (
    <group rotation={[-Math.PI / 2.6, 0, 0]}>
      <mesh ref={outerRef} visible={false}>
        <ringGeometry args={[0.72, 0.86, 64]} />
        <meshBasicMaterial
          ref={outerMat}
          color="#d8a768"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={innerRef} visible={false}>
        <ringGeometry args={[0.78, 0.84, 64]} />
        <meshBasicMaterial
          ref={innerMat}
          color="#e8c580"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * A whirl of fine gold motes that spirals INTO the object while it changes
 * form — the energy the outgoing shape collapses into and the incoming one
 * blooms out of. Peaks exactly when both models are near-invisible, so the
 * handover always has something spectacular on screen.
 */
export function MorphVortex({ energy, count = 90 }: { energy: RefObject<number>; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const rng = mulberry32(67);
    const s = Array.from({ length: count }, () => ({
      radius: 1.3 + rng() * 1.1,
      angle: rng() * Math.PI * 2,
      height: (rng() - 0.5) * 1.6,
      spin: 3.5 + rng() * 3,
      drift: rng(),
    }));
    return { positions: new Float32Array(count * 3), seeds: s };
  }, [count]);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;
    const e = energy.current ?? 0;
    points.visible = e > 0.03;
    if (materialRef.current) materialRef.current.opacity = Math.sin(Math.min(1, e) * Math.PI) * 0.9;
    if (!points.visible) return;

    const t = clock.elapsedTime;
    const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      // each mote spirals inward as energy rises; staggered by drift so the
      // funnel tightens progressively instead of contracting as a shell
      const pull = Math.min(1, e * (0.7 + seed.drift * 0.8));
      const radius = lerpN(seed.radius, 0.12, pull * pull);
      const angle = seed.angle + t * 1.2 + pull * seed.spin;
      attr.setXYZ(
        i,
        Math.cos(angle) * radius,
        seed.height * (1 - pull * 0.75) + Math.sin(angle * 2) * 0.05,
        Math.sin(angle) * radius,
      );
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} visible={false}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        map={softCircleTexture()}
        color="#c99a45"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  );
}

function lerpN(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Steam rising off whatever is brewing. Particles loop up a column, swaying
 * and fading as they climb; `weight` fades the whole plume in and out with
 * the act it belongs to.
 */
export function Steam3D({
  weight,
  count = 26,
  origin = [0, 0.1, 0],
  spread = 0.24,
  height = 1.5,
}: {
  weight: RefObject<number>;
  count?: number;
  origin?: [number, number, number];
  spread?: number;
  height?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const { positions, seeds } = useMemo(() => {
    const rng = mulberry32(53);
    const s = Array.from({ length: count }, () => ({
      speed: 0.16 + rng() * 0.16,
      sway: (rng() - 0.5) * 2,
      phase: rng() * Math.PI * 2,
      radius: rng() * spread,
      // staggered offset so the column is already full on the first frame
      offset: rng(),
    }));
    return { positions: new Float32Array(count * 3), seeds: s };
  }, [count, spread]);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;
    const w = weight.current ?? 0;
    points.visible = w > 0.02;
    if (materialRef.current) materialRef.current.opacity = w * 0.32;
    if (!points.visible) return;

    const t = clock.elapsedTime;
    const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      // climb is a pure function of the clock — no per-frame state to mutate,
      // so the plume also survives the component re-rendering
      const climb = (t * seed.speed + seed.offset) % 1;
      // widens and drifts sideways as it rises, like real steam
      const drift = Math.sin(t * 0.8 + seed.phase) * seed.sway * 0.12 * climb;
      attr.setXYZ(
        i,
        origin[0] + Math.cos(seed.phase) * seed.radius * (1 + climb) + drift,
        origin[1] + climb * height,
        origin[2] + Math.sin(seed.phase) * seed.radius * (1 + climb),
      );
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} visible={false}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        map={softCircleTexture()}
        color="#f4ece0"
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Aroma swirl — two lazy rings of fine particles orbiting the object on
 * tilted planes, tightening as the scroll story advances.
 */
export function AromaSwirl({ count = 60 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, seeds } = useMemo(() => {
    const rng = mulberry32(37);
    const pos = new Float32Array(count * 3);
    const s = Array.from({ length: count }, () => ({
      radius: 1.05 + rng() * 0.7,
      speed: 0.12 + rng() * 0.2,
      phase: rng() * Math.PI * 2,
      tilt: (rng() - 0.5) * 1.1,
      bob: 0.1 + rng() * 0.3,
    }));
    return { positions: pos, seeds: s };
  }, [count]);

  useFrame(({ clock }) => {
    const points = pointsRef.current;
    if (!points) return;
    const t = clock.elapsedTime;
    const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const a = seed.phase + t * seed.speed;
      attr.setXYZ(
        i,
        Math.cos(a) * seed.radius,
        Math.sin(a * 1.3) * seed.bob + Math.sin(a) * seed.radius * seed.tilt * 0.35,
        Math.sin(a) * seed.radius * 0.7,
      );
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={softCircleTexture()}
        color="#a9793a"
        size={0.032}
        sizeAttenuation
        transparent
        opacity={0.42}
        depthWrite={false}
      />
    </points>
  );
}
