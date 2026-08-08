import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Steam3D } from "./MorphFX";

/**
 * Act 4: the capsule becomes the machine that brews it — a stylized prosumer
 * espresso machine in the brand's espresso-brown, ivory and gold.
 *
 * The silhouette is what sells it: a back tower with an overhanging canopy
 * (cup-warmer rail on top), a chrome group head with a portafilter hanging
 * under the canopy, twin spouts brewing into a small porcelain cup on the
 * drip tray, a gauge, a steam wand and a power lamp that glows while the
 * pour runs. All primitives — nothing to download. `pourRef` is read in
 * useFrame rather than passed as a prop so scrolling never re-renders React.
 */

interface MachineModelProps {
  pourRef: RefObject<number>;
  /**
   * Phone layout. The machine is the most expensive thing in the scene by a
   * wide margin — it is assembled from ~50 separate primitives, so it costs
   * ~56 draw calls a frame against the capsule's 9, and it is drawn while the
   * variants zone unpins, which is the busiest scroll moment on the page. On a
   * phone it renders about 140px tall, where the trim below is between one and
   * zero pixels wide: the grill slats, the pinstripes down the face panel, the
   * cup-warmer rail and the cups on it, the gauge's dial face and needle, and
   * the feet all resolve to nothing you can see. Dropping them there costs the
   * silhouette nothing and buys back a third of the frame's draw calls.
   */
  compact: boolean;
}

const BODY = "#3e2b1e";
const IVORY = "#f3e9da";
const GOLD = "#c99a45";
const CHROME = "#d3d6da";
const ESPRESSO = "#5b3218";

export function MachineModel({ pourRef, compact }: MachineModelProps) {
  const detailed = !compact;
  const streamsRef = useRef<THREE.Group>(null);
  const cremaRef = useRef<THREE.Mesh>(null);
  const lampRef = useRef<THREE.MeshStandardMaterial>(null);

  const body = useMemo(() => physical(BODY, { metalness: 0.35, roughness: 0.4, clearcoat: 0.7 }), []);
  const ivory = useMemo(() => physical(IVORY, { metalness: 0.05, roughness: 0.3, clearcoat: 0.6 }), []);
  const gold = useMemo(() => physical(GOLD, { metalness: 0.9, roughness: 0.18, clearcoat: 0.8 }), []);
  const chrome = useMemo(() => physical(CHROME, { metalness: 0.85, roughness: 0.16, clearcoat: 0.6 }), []);
  const coffee = useMemo(
    () => physical(ESPRESSO, { metalness: 0.1, roughness: 0.22, clearcoat: 0.9, opacity: 0.94 }),
    [],
  );

  const towerGeometry = useMemo(() => new RoundedBoxGeometry(1.5, 1.45, 0.55, 3, 0.09), []);
  const facePanelGeometry = useMemo(() => new RoundedBoxGeometry(1.34, 1.02, 0.06, 2, 0.03), []);
  const canopyGeometry = useMemo(() => new RoundedBoxGeometry(1.56, 0.4, 1.05, 3, 0.09), []);
  const baseGeometry = useMemo(() => new RoundedBoxGeometry(1.56, 0.16, 1.05, 2, 0.05), []);
  const trayGeometry = useMemo(() => new RoundedBoxGeometry(0.92, 0.06, 0.56, 2, 0.02), []);
  const plateGeometry = useMemo(() => new RoundedBoxGeometry(0.44, 0.13, 0.03, 2, 0.012), []);

  // streams grow downward out of the spouts; crema fills the cup behind them;
  // the power lamp breathes while the machine brews
  useFrame(({ clock }) => {
    const pour = pourRef.current ?? 0;
    const streams = streamsRef.current;
    if (streams) {
      streams.visible = pour > 0.02;
      const wobble = 1 + Math.sin(clock.elapsedTime * 9) * 0.06;
      streams.scale.set(wobble, Math.max(0.001, pour), wobble);
    }
    const crema = cremaRef.current;
    if (crema) {
      const fill = Math.min(1, pour * 1.2);
      crema.visible = fill > 0.05;
      crema.scale.setScalar(fill);
      crema.position.y = -0.56 + fill * 0.1;
    }
    const lamp = lampRef.current;
    if (lamp) {
      lamp.emissiveIntensity = pour * (1.4 + Math.sin(clock.elapsedTime * 3) * 0.35);
    }
  });

  return (
    <group position={[0, 0.02, 0]}>
      {/* feet */}
      {detailed &&
        [-0.62, 0.62].flatMap((x) =>
          [-0.32, 0.34].map((z) => (
            <mesh key={`${x}${z}`} material={gold} position={[x, -0.88, z]}>
              <cylinderGeometry args={[0.055, 0.07, 0.08, 16]} />
            </mesh>
          )),
        )}

      {/* base platform + drip tray with grill slats */}
      <mesh geometry={baseGeometry} material={body} position={[0, -0.78, -0.02]} castShadow />
      <mesh geometry={trayGeometry} material={chrome} position={[0, -0.68, 0.18]} />
      {detailed &&
        [-0.18, -0.06, 0.06, 0.18].map((z) => (
          <mesh key={z} material={body} position={[0, -0.648, 0.18 + z * 0.9]}>
            <boxGeometry args={[0.86, 0.014, 0.045]} />
          </mesh>
        ))}

      {/* back tower with an ivory face panel */}
      <mesh geometry={towerGeometry} material={body} position={[0, 0.02, -0.28]} castShadow />
      <mesh geometry={facePanelGeometry} material={ivory} position={[0, -0.02, -0.005]} />
      {/* slim gold pinstripes framing the panel */}
      {detailed &&
        [-0.6, 0.6].map((x) => (
          <mesh key={x} material={gold} position={[x, -0.02, 0.02]}>
            <boxGeometry args={[0.025, 0.98, 0.02]} />
          </mesh>
        ))}

      {/* canopy overhanging the brew area */}
      <mesh geometry={canopyGeometry} material={body} position={[0, 0.64, -0.05]} castShadow />
      {/* cup-warmer rail + two cups waiting on top */}
      {detailed &&
        [-0.34, -0.02, 0.3].map((z) => (
          <mesh key={z} material={gold} position={[0, 0.87, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.016, 0.016, 1.34, 10]} />
          </mesh>
        ))}
      {detailed &&
        [-0.36, 0.34].map((x) => (
          <group key={x} position={[x, 0.92, -0.16]}>
            <mesh material={ivory}>
              <cylinderGeometry args={[0.09, 0.065, 0.11, 20, 1, true]} />
            </mesh>
            <mesh material={ivory} position={[0, -0.05, 0]}>
              <cylinderGeometry args={[0.066, 0.066, 0.02, 20]} />
            </mesh>
          </group>
        ))}

      {/* canopy front: gauge, brand plate, power lamp */}
      <group position={[-0.44, 0.64, 0.475]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh material={chrome}>
          <cylinderGeometry args={[0.135, 0.135, 0.05, 28]} />
        </mesh>
        {detailed && (
          <>
            <mesh material={ivory} position={[0, -0.028, 0]}>
              <cylinderGeometry args={[0.108, 0.108, 0.01, 28]} />
            </mesh>
            {/* needle */}
            <mesh material={gold} position={[0, -0.036, 0.02]} rotation={[0, -0.7, 0]}>
              <boxGeometry args={[0.012, 0.008, 0.09]} />
            </mesh>
          </>
        )}
      </group>
      <mesh geometry={plateGeometry} material={gold} position={[0, 0.64, 0.48]} />
      <mesh position={[0.44, 0.64, 0.475]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.045, 20]} />
        <meshStandardMaterial
          ref={lampRef}
          color={GOLD}
          emissive="#ffb84d"
          emissiveIntensity={0}
          roughness={0.3}
          metalness={0.4}
          transparent
        />
      </mesh>

      {/* group head + portafilter hanging under the canopy */}
      <group position={[0, 0, 0.16]}>
        <mesh material={chrome} position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.22, 28]} />
        </mesh>
        <mesh material={gold} position={[0, 0.21, 0]}>
          <cylinderGeometry args={[0.185, 0.16, 0.08, 28]} />
        </mesh>
        <mesh material={chrome} position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.155, 0.12, 0.1, 28]} />
        </mesh>
        {/* portafilter handle angling toward the viewer */}
        <mesh material={body} position={[0, 0.08, 0.31]} rotation={[Math.PI / 2 - 0.28, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.05, 0.52, 16]} />
        </mesh>
        <mesh material={gold} position={[0, 0.005, 0.545]} rotation={[Math.PI / 2 - 0.28, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.07, 16]} />
        </mesh>
        {/* twin spouts */}
        {[-0.055, 0.055].map((x) => (
          <mesh key={x} material={chrome} position={[x, 0.055, 0.02]}>
            <cylinderGeometry args={[0.02, 0.028, 0.07, 12]} />
          </mesh>
        ))}
      </group>

      {/* steam wand off the right side, ball joint at the canopy */}
      <mesh material={gold} position={[0.6, 0.42, 0.12]}>
        <sphereGeometry args={[0.055, 16, 12]} />
      </mesh>
      <mesh material={chrome} position={[0.7, 0.1, 0.2]} rotation={[0.2, 0, 0.32]}>
        <cylinderGeometry args={[0.024, 0.019, 0.68, 14]} />
      </mesh>
      <mesh material={chrome} position={[0.795, -0.21, 0.245]} rotation={[0.2, 0, 0.32]}>
        <cylinderGeometry args={[0.03, 0.022, 0.09, 14]} />
      </mesh>
      {/* matching control knob on the left */}
      <mesh material={gold} position={[-0.66, 0.42, 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 20]} />
      </mesh>

      {/* the porcelain cup being filled, on its little saucer */}
      <group position={[0, 0, 0.18]}>
        <mesh material={ivory} position={[0, -0.545, 0]}>
          <cylinderGeometry args={[0.15, 0.105, 0.22, 28, 1, true]} />
        </mesh>
        <mesh material={ivory} position={[0, -0.652, 0]}>
          <cylinderGeometry args={[0.107, 0.107, 0.02, 28]} />
        </mesh>
        <mesh material={ivory} position={[0, -0.648, 0]}>
          <cylinderGeometry args={[0.24, 0.26, 0.025, 32]} />
        </mesh>
        <mesh ref={cremaRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <circleGeometry args={[0.135, 28]} />
          <meshPhysicalMaterial color="#8a5326" roughness={0.3} clearcoat={0.7} transparent />
        </mesh>
      </group>

      {/* twin pour streams, anchored at the spouts and growing downward */}
      <group ref={streamsRef} position={[0, 0.055, 0.18]} visible={false}>
        {[-0.055, 0.055].map((x) => (
          <mesh key={x} material={coffee} position={[x, -0.25, 0]}>
            <cylinderGeometry args={[0.014, 0.02, 0.5, 10]} />
          </mesh>
        ))}
      </group>

      {/* steam curling off the fresh espresso while the pour runs */}
      <Steam3D weight={pourRef} count={10} origin={[0, -0.4, 0.18]} spread={0.1} height={0.8} />
    </group>
  );
}

function physical(
  color: string,
  options: {
    metalness: number;
    roughness: number;
    clearcoat: number;
    opacity?: number;
  },
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: options.metalness,
    roughness: options.roughness,
    clearcoat: options.clearcoat,
    clearcoatRoughness: 0.2,
    opacity: options.opacity ?? 1,
    transparent: true,
  });
}
