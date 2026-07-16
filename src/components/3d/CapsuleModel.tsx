import { useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

/**
 * Procedural Nespresso-style capsule: lathe profile with few radial segments
 * + flat shading = the faceted metallic look of the product photos.
 * No external model file — nothing to download.
 */

const PROFILE: Array<[number, number]> = [
  [0.001, 0.0],
  [0.72, 0.0],
  [0.8, 0.025],
  [0.82, 0.07],
  [0.62, 0.11],
  [0.6, 0.3],
  [0.54, 0.85],
  [0.42, 1.12],
  [0.22, 1.26],
  [0.001, 1.3],
];

interface CapsuleModelProps {
  materialRef: RefObject<THREE.MeshPhysicalMaterial | null>;
  initialColor: string;
}

export function CapsuleModel({ materialRef, initialColor }: CapsuleModelProps) {
  const geometry = useMemo(() => {
    const points = PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(points, 18);
    geo.center();
    return geo;
  }, []);

  const foilGeometry = useMemo(() => new THREE.CircleGeometry(0.7, 40), []);

  return (
    <group>
      {/* moderate metalness — reads its variant color under plain lights,
          no HDR environment download required */}
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          ref={materialRef}
          color={initialColor}
          metalness={0.55}
          roughness={0.28}
          clearcoat={0.9}
          clearcoatRoughness={0.25}
          flatShading
        />
      </mesh>
      {/* silver foil lid on the flange side */}
      <mesh geometry={foilGeometry} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.649, 0]}>
        <meshPhysicalMaterial color="#d3d3d8" metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  );
}
