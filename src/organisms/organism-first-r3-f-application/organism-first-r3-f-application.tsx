import { MutableRefObject, useRef } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CustomObject from '@/utils/components/CustomObject';
import styles from './organism-first-r3-f-application.module.scss';

extend({ OrbitControls });

export default function OrganismFirstR3FApplication() {
  const { camera, gl } = useThree();

  const groupRef: MutableRefObject<any> = useRef();
  const cubeRef: MutableRefObject<any> = useRef();

  console.log(camera, gl);

  useFrame((state, delta) => {
    const angle = state.clock.elapsedTime;
    state.camera.position.x = Math.sin(angle);

    cubeRef.current.rotation.y += delta;

    // groupRef.current.rotation.y += delta;
  });

  return (
    <>
      {/* <orbitControls args={[camera, gl.domElement]} /> */}

      <directionalLight position={[1, 2, 3]} intensity={1.5} />
      <ambientLight intensity={0.5} />

      <group ref={groupRef}>
        <mesh position-x={-2}>
          <sphereGeometry />
          <meshStandardMaterial color="orange" />
        </mesh>
        <mesh
          ref={cubeRef}
          rotation-y={Math.PI * 0.25}
          position-x={2}
          scale={1.5}
        >
          <boxGeometry />
          <meshStandardMaterial color="mediumpurple" />
        </mesh>
      </group>
      <mesh position-y={-1} rotation-x={-Math.PI * 0.5} scale={10}>
        <planeGeometry />
        <meshBasicMaterial color="greenyellow" />
      </mesh>

      <CustomObject />
    </>
  );
}
