import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/random";
import { softCircleTexture } from "./softCircle";

/** Fine gold particles drifting upward — very cheap. */

export function GoldDust({ count = 140 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const rng = mulberry32(11);
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rng() - 0.5) * 9;
      pos[i * 3 + 1] = (rng() - 0.5) * 7;
      pos[i * 3 + 2] = -1 - rng() * 3;
      spd[i] = 0.05 + rng() * 0.18;
    }
    return { positions: pos, speeds: spd };
  }, [count]);

  useFrame((_state, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + speeds[i] * delta;
      if (y > 3.6) y = -3.6;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={count}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      {/* normal blending — additive vanishes on the light cream theme */}
      <pointsMaterial
        map={softCircleTexture()}
        color="#b98a3c"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}
