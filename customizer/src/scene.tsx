import {
  AccumulativeShadows,
  Center,
  Decal,
  Environment,
  RandomizedLight,
  useGLTF,
  useTexture,
} from "@react-three/drei";
import { Canvas, RootState, useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { ReactNode, RefObject, useRef } from "react";
import type { BufferGeometry, Color, Mesh, MeshLambertMaterial } from "three";
import { Euler } from "three";
import { useSnapshot } from "valtio";
import "./index.css";
import { state } from "./store";

function Scene() {
  const rootElement: HTMLElement | null = document.getElementById("root");
  return (
    <>
      {rootElement && (
        <Canvas
          shadows
          camera={{ position: [0, 0, 2.5], fov: 25 }}
          gl={{ preserveDrawingBuffer: true }}
          eventSource={rootElement}
          eventPrefix="client"
        >
          <ambientLight intensity={0.5} />
          <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />

          <CameraRig>
            <Backdrop />
            <Center>
              <Shirt />
            </Center>
          </CameraRig>
        </Canvas>
      )}
    </>
  );
}

export default Scene;

function Shirt() {
  const snap = useSnapshot(state);
  const texture = useTexture(`/${snap.selectedDecal}.png`);
  const { nodes, materials } = useGLTF("/shirt_baked_collapsed.glb");

  useFrame((_frameState, delta) => {
    easing.dampC(
      (materials.lambert1 as MeshLambertMaterial).color,
      snap.selectedColor,
      0.25,
      delta
    );
  });

  const shirtMesh = nodes.T_Shirt_male as Mesh;
  const shirtGeometry = shirtMesh.geometry as BufferGeometry;

  return (
    <mesh
      castShadow
      geometry={shirtGeometry}
      material={materials.lambert1}
      material-roughness={1}
      dispose={null}
    >
      <Decal
        position={[0, 0.04, 0.15]}
        rotation={[0, 0, 0]}
        scale={0.2}
        map={texture}
      />
    </mesh>
  );
}

type ShadowsRef = {
  getMesh: () => { material: { color: Color } };
};

function Backdrop() {
  const shadows: RefObject<ShadowsRef> = useRef<ShadowsRef>(null);

  useFrame((_frameState: RootState, delta: number) => {
    if (shadows.current) {
      easing.dampC(
        shadows.current.getMesh().material.color,
        state.selectedColor,
        0.25,
        delta
      );
    }
  });

  return (
    <AccumulativeShadows
      // @ts-expect-error: Ignore TypeScript error for the following line
      ref={shadows}
      temporal
      frames={60}
      alphaTest={0.85}
      scale={10}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, 0, -0.14]}
    >
      <RandomizedLight
        amount={4}
        radius={9}
        intensity={2.05}
        ambient={0.25}
        position={[5, 5, -10]}
      />
      <RandomizedLight
        amount={4}
        radius={5}
        intensity={1.25}
        ambient={0.55}
        position={[-5, 5, -9]}
      />
    </AccumulativeShadows>
  );
}

type CameraRigProps = {
  children: ReactNode;
};

function CameraRig({ children }: CameraRigProps) {
  const group = useRef({ rotation: new Euler() });

  useFrame((state, delta) => {
    easing.damp3(state.camera.position, [0, 0, 2], 0.25, delta);
    easing.dampE(
      group.current.rotation,
      [state.pointer.y / 10, -state.pointer.x / 5, 0],
      0.25,
      delta
    );
  });
  return (
    <group
      // @ts-expect-error: Ignore TypeScript error for the following line
      ref={group}
    >
      {children}
    </group>
  );
}

useGLTF.preload("/shirt_baked_collapsed.glb");
