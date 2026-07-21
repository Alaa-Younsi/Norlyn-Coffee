import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/random";
import { scrollProgress } from "@/lib/scrollProgress";

/**
 * Floating stylized coffee beans — instanced ellipsoids with a per-instance
 * drift, gently parallaxing upward as the page scrolls.
 */

interface BeanSeed {
  base: THREE.Vector3;
  rot: THREE.Euler;
  scale: number;
  speed: number;
  phase: number;
}

export function Beans({ count = 12 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo<BeanSeed[]>(() => {
    const rng = mulberry32(7);
    return Array.from({ length: count }, () => ({
      base: new THREE.Vector3(
        (rng() - 0.5) * 9,
        (rng() - 0.5) * 5.5,
        -2.2 - rng() * 3,
      ),
      rot: new THREE.Euler(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI),
      scale: 0.055 + rng() * 0.06,
      speed: 0.25 + rng() * 0.5,
      phase: rng() * Math.PI * 2,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    const p = scrollProgress.current;
    seeds.forEach((seed, i) => {
      dummy.position.set(
        seed.base.x + Math.sin(t * seed.speed + seed.phase) * 0.25,
        seed.base.y + Math.cos(t * seed.speed * 0.8 + seed.phase) * 0.3 + p * 3.2,
        seed.base.z,
      );
      dummy.rotation.set(
        seed.rot.x + t * 0.12 * seed.speed,
        seed.rot.y + t * 0.16 * seed.speed,
        seed.rot.z,
      );
      // coffee-bean proportions, not a marble
      dummy.scale.set(seed.scale, seed.scale * 0.6, seed.scale * 0.78);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh key={count} ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 14, 10]} />
      <meshStandardMaterial color="#5b3620" roughness={0.5} metalness={0.15} />
    </instancedMesh>
  );
}
