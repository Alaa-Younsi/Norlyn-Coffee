import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Fine gold particles drifting upward — additive, very cheap. */

const COUNT = 140;

export function GoldDust() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const rng = mulberry32(11);
    const pos = new Float32Array(COUNT * 3);
    const spd = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (rng() - 0.5) * 9;
      pos[i * 3 + 1] = (rng() - 0.5) * 7;
      pos[i * 3 + 2] = -1 - rng() * 3;
      spd[i] = 0.05 + rng() * 0.18;
    }
    return { positions: pos, speeds: spd };
  }, []);

  useFrame((_state, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      let y = attr.getY(i) + speeds[i] * delta;
      if (y > 3.6) y = -3.6;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* normal blending — additive vanishes on the light cream theme */}
      <pointsMaterial
        color="#b98a3c"
        size={0.03}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
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
