import * as THREE from "three";

let cached: THREE.CanvasTexture | null = null;

/**
 * Soft radial-gradient disc shared by every particle system. Without a map,
 * PointsMaterial renders each particle as a hard square — the grey blocks
 * that used to float around the morphs. One tiny canvas texture turns them
 * all into round, feathered motes.
 */
export function softCircleTexture(): THREE.CanvasTexture {
  if (cached) return cached;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.85)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.28)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  cached = new THREE.CanvasTexture(canvas);
  return cached;
}
