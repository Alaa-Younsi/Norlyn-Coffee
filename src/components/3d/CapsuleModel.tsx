import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

/**
 * Procedural Nespresso-style capsule modeled on the Moriva product photos:
 * a smooth conical body rising from a slim silver rim, topped by a FACETED
 * crown (the signature look of the real capsules), silver foil underneath.
 * No external model file — nothing to download.
 */

// smooth lower body: flange lip → straight taper → shoulder
const BODY_PROFILE: Array<[number, number]> = [
  [0.001, 0.0],
  [0.66, 0.0],
  [0.73, 0.02],
  [0.74, 0.06],
  [0.63, 0.085],
  [0.6, 0.11],
  [0.55, 0.42],
  [0.49, 0.72],
  [0.455, 0.82],
];

// faceted crown: continues the shoulder up to a small flat top
const CROWN_PROFILE: Array<[number, number]> = [
  [0.455, 0.82],
  [0.4, 0.98],
  [0.3, 1.1],
  [0.17, 1.17],
  [0.001, 1.2],
];

const HALF_HEIGHT = 0.6;

interface CapsuleModelProps {
  materialRef: RefObject<THREE.MeshPhysicalMaterial | null>;
  initialColor: string;
}

export function CapsuleModel({ materialRef, initialColor }: CapsuleModelProps) {
  const bodyGeometry = useMemo(() => {
    const points = BODY_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(points, 64);
    geo.translate(0, -HALF_HEIGHT, 0);
    return geo;
  }, []);

  // few radial segments + per-face normals = the crisp metallic facets
  const crownGeometry = useMemo(() => {
    const points = CROWN_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
    const geo = new THREE.LatheGeometry(points, 16).toNonIndexed();
    geo.computeVertexNormals();
    geo.translate(0, -HALF_HEIGHT, 0);
    return geo;
  }, []);

  // one shared material so the scroll choreography tints body + crown together
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: initialColor,
        metalness: 0.62,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
      }),
    [initialColor],
  );

  useEffect(() => {
    materialRef.current = material;
    return () => {
      materialRef.current = null;
    };
  }, [material, materialRef]);

  const foilGeometry = useMemo(() => new THREE.CircleGeometry(0.64, 48), []);

  return (
    <group>
      <mesh geometry={bodyGeometry} material={material} castShadow />
      <mesh geometry={crownGeometry} material={material} castShadow />

      {/* slim silver rim hugging the flange, like the aluminium lip */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -HALF_HEIGHT + 0.04, 0]}>
        <torusGeometry args={[0.725, 0.03, 12, 64]} />
        <meshPhysicalMaterial
          color="#d8d8dd"
          metalness={0.8}
          roughness={0.25}
          clearcoat={0.6}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* silver foil lid on the flange side */}
      <mesh
        geometry={foilGeometry}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -HALF_HEIGHT - 0.001, 0]}
      >
        <meshPhysicalMaterial
          color="#e4e4e8"
          metalness={0.4}
          roughness={0.35}
          clearcoat={0.5}
          clearcoatRoughness={0.3}
        />
      </mesh>
    </group>
  );
}
