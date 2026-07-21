import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Wraps one act's model and drives its visibility from a weight ref, so the
 * scroll story can cross-dissolve cup → capsule → machine without any React
 * re-render. Each material's authored opacity is remembered the first time it
 * is seen (in userData) and everything scales from there, which keeps
 * deliberately semi-transparent parts — the pour stream — semi-transparent.
 */

interface MorphSlotProps {
  weight: RefObject<number>;
  children: ReactNode;
}

export function MorphSlot({ weight, children }: MorphSlotProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const w = weight.current ?? 0;

    // fully faded slots cost nothing: skip the subtree entirely
    group.visible = w > 0.012;
    if (!group.visible) return;

    // a form blooms out (slight overshoot) as it appears and implodes as it
    // leaves — paired with the staggered weights this reads as one object
    // collapsing into energy and re-forming, not two shapes cross-fading
    group.scale.setScalar(0.55 + 0.45 * easeOutBack(w));

    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of materials) {
        if (material.userData.baseOpacity === undefined) {
          material.userData.baseOpacity = material.opacity;
          material.transparent = true;
        }
        material.opacity = (material.userData.baseOpacity as number) * w;
        // only write depth once the model is essentially solid — mid-morph the
        // two overlapping models would otherwise punch holes in each other
        material.depthWrite = w > 0.9;
      }
    });
  });

  return <group ref={groupRef}>{children}</group>;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
