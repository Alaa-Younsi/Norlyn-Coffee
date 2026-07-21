import { useMemo } from "react";
import * as THREE from "three";

/**
 * Act 1: a porcelain espresso cup on its saucer — the shape the scroll story
 * starts from before it transforms into the Moriva capsule.
 *
 * The body is one continuous lathe: up the footed base, out through a tulip
 * curve, over a rolled lip and back down the inside, so the cup is genuinely
 * hollow with visible wall thickness. The handle is a tube swept along a
 * curve whose both ends are buried inside the wall — it reads as cast into
 * the porcelain instead of a ring floating next to it.
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
    return new THREE.TubeGeometry(curve, 40, 0.042, 14, false);
  }, []);

  // radial gradient: dark espresso in the middle, caramel crema at the edge
  const cremaTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
    gradient.addColorStop(0, "#2a1408");
    gradient.addColorStop(0.5, "#53300f");
    gradient.addColorStop(0.82, "#a86c30");
    gradient.addColorStop(0.95, "#d8a768");
    gradient.addColorStop(1, "#e8c088");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  const porcelain = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        ...PORCELAIN,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    [],
  );

  const porcelainHandle = useMemo(
    () => new THREE.MeshPhysicalMaterial({ ...PORCELAIN, transparent: true }),
    [],
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
      <mesh geometry={cupGeometry} material={porcelain} castShadow />
      <mesh geometry={saucerGeometry} material={porcelain} />
      <mesh geometry={handleGeometry} material={porcelainHandle} castShadow />

      {/* the espresso itself, crema shading toward the rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[0.487, 64]} />
        <meshPhysicalMaterial
          map={cremaTexture}
          color={cremaTexture ? "#ffffff" : "#4a2a12"}
          roughness={0.26}
          metalness={0.08}
          clearcoat={0.85}
          clearcoatRoughness={0.18}
          transparent
        />
      </mesh>

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

function lathe(profile: Array<[number, number]>, segments: number): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    segments,
  );
}
