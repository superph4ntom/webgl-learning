import { useRef, MutableRefObject } from 'react';
import {
  Text,
  Html,
  Float,
  PivotControls,
  TransformControls,
  OrbitControls,
  MeshReflectorMaterial,
} from '@react-three/drei';
import styles from './organism-r3f-drei.module.scss';

export default function OrganismR3fDrei() {
  const cubeRef: MutableRefObject<any> = useRef();
  const sphereRef: MutableRefObject<any> = useRef();
  return (
    <>
      <OrbitControls makeDefault />
      <directionalLight position={[1, 2, 3]} intensity={1.5} />
      <ambientLight intensity={0.5} />

      <group>
        <PivotControls
          anchor={[0, 0, 0]}
          depthTest={false}
          lineWidth={4}
          axisColors={['#9381ff', '#ff4d6d', '#7ae582']}
          scale={100}
          fixed={true}
        >
          <mesh ref={sphereRef} position-x={-2}>
            <sphereGeometry />
            <meshStandardMaterial color="orange" />
            <Html
              position={[1, 1, 0]}
              wrapperClass={styles.label}
              center
              distanceFactor={6}
              occlude={[sphereRef, cubeRef]}
            >
              That is a shpere
            </Html>
          </mesh>
        </PivotControls>

        <mesh ref={cubeRef} scale={1.5} position-x={2}>
          <boxGeometry />
          <meshStandardMaterial color="mediumpurple" />
        </mesh>
        <TransformControls object={cubeRef} mode="translate" />
      </group>

      <mesh position-y={-1} rotation-x={-Math.PI * 10.5} scale={10}>
        <planeGeometry />
        {/* <meshBasicMaterial color="greenyellow" /> */}
        <MeshReflectorMaterial
          resolution={512}
          blur={[1000, 1000]}
          mixBlur={1}
          mirror={0.75}
          color="greenyellow"
        />
      </mesh>

      <Float speed={5} floatIntensity={2}>
        <Text
          font="/fonts/silkscreen-regular.ttf"
          fontSize={1}
          color="salmon"
          position-y={2}
          textAlign="center"
        >
          Hi R3F DREI
          <meshNormalMaterial />
        </Text>
      </Float>
    </>
  );
}
