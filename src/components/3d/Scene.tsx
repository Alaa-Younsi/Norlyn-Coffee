import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CapsuleModel } from "./CapsuleModel";
import { Beans } from "./Beans";
import { GoldDust } from "./GoldDust";
import { computeSceneState } from "./sceneConfig";
import { scrollProgress } from "@/lib/scrollProgress";

interface SceneProps {
  /** variant accent colors, in showcase order (hero starts on the first) */
  colors: string[];
  dirSign: 1 | -1;
}

function Rig({ colors, dirSign }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const targetColor = useRef(new THREE.Color(colors[0]));
  const colorA = useRef(new THREE.Color());
  const colorB = useRef(new THREE.Color());

  useFrame(({ clock, gl }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const state = computeSceneState(scrollProgress.current, dirSign, colors.length);
    const damp = Math.min(1, delta * 5);

    group.position.x += (state.x - group.position.x) * damp;
    group.position.y +=
      (state.y + Math.sin(clock.elapsedTime * 0.9) * 0.06 - group.position.y) * damp;
    const scale = group.scale.x + (state.scale - group.scale.x) * damp;
    group.scale.setScalar(scale);
    group.rotation.y += (state.rotY + clock.elapsedTime * 0.28 - group.rotation.y) * damp;
    group.rotation.z += (state.rotZ - group.rotation.z) * damp;

    const material = materialRef.current;
    if (material) {
      const idx = Math.floor(state.colorPos);
      const frac = state.colorPos - idx;
      colorA.current.set(colors[idx]);
      colorB.current.set(colors[Math.min(idx + 1, colors.length - 1)]);
      targetColor.current.copy(colorA.current).lerp(colorB.current, frac);
      material.color.lerp(targetColor.current, Math.min(1, delta * 6));
    }

    gl.domElement.style.opacity = state.fade.toFixed(3);
  });

  return (
    <group ref={groupRef} position={[0, -0.02, 0]}>
      <CapsuleModel materialRef={materialRef} initialColor={colors[0]} />
    </group>
  );
}

export function Scene({ colors, dirSign }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      {/* plain-light studio: reliable color rendition, no HDR download */}
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#fff6e6", "#5b3a22", 0.7]} />
      <directionalLight position={[3, 4, 5]} intensity={2.1} color="#fff2dd" />
      <directionalLight position={[-4, 2, -3]} intensity={0.8} color="#dfe6ff" />
      <pointLight position={[0, -2, 3]} intensity={0.7} color="#e8c580" />

      <Rig colors={colors} dirSign={dirSign} />
      <Beans />
      <GoldDust />
    </Canvas>
  );
}
