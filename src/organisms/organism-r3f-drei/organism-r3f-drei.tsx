import { useRef, MutableRefObject } from 'react';
import {
  Text,
  Html,
  Float,
  PivotControls,
  TransformControls,
  OrbitControls,
  MeshReflectorMaterial,
  useHelper,
  BakeShadows,
  SoftShadows,
  AccumulativeShadows,
  RandomizedLight,
  Sky,
  Environment,
} from '@react-three/drei';
import { DirectionalLightHelper } from 'three';
import { useControls, button } from 'leva';
import { Perf } from 'r3f-perf';
import styles from './organism-r3f-drei.module.scss';
import { useFrame } from '@react-three/fiber';

export default function OrganismR3fDrei() {
  const cubeRef: MutableRefObject<any> = useRef();
  const sphereRef: MutableRefObject<any> = useRef();
  const directionalLightRef: MutableRefObject<any> = useRef();

  useHelper(directionalLightRef, DirectionalLightHelper, 1);

  useFrame((state, delta) => {
    cubeRef.current.rotation.y += delta;
  });

  const sphereOptions = useControls('sphere', {
    position: {
      value: { x: -2, y: 0 },
      step: 0.01,
      joystick: 'invertY',
    },
    color: '#ff0000',
    visible: true,
    myInterval: {
      min: 0,
      max: 10,
      value: [4, 5],
    },
    clickMe: button(() => {
      console.log('ok');
    }),
    choice: { options: ['a', 'b', 'c'] },
  });

  const cubeOptions = useControls('cube', {
    scale: {
      value: 1.5,
      step: 0.01,
      min: 0,
      max: 5,
    },
  });

  const { sunPosition }: any = useControls('sky', {
    sunPosition: { value: [1, 2, 3] },
  });

  const { envMapIntensity } = useControls('environment map', {
    envMapIntensity: { value: 3.5, min: 0, max: 12 },
  });

  return (
    <>
      <Environment
        background
        // files={[
        //   '/environmentMaps/2/px.jpg',
        //   '/environmentMaps/2/nx.jpg',
        //   '/environmentMaps/2/py.jpg',
        //   '/environmentMaps/2/ny.jpg',
        //   '/environmentMaps/2/pz.jpg',
        //   '/environmentMaps/2/nz.jpg',
        // ]}
        files={'./environmentMaps/the_sky_is_on_fire_2k.hdr'}
      />
      {/* <BakeShadows /> */}
      <SoftShadows
        frustum={3.75}
        size={50}
        near={9.5}
        samples={17}
        rings={11}
      />

      <Perf position="top-left" />
      <OrbitControls makeDefault />

      {/* <AccumulativeShadows
        position={[0, -0.99, 0]}
        scale={10}
        color="#316d39"
        opacity={0.8}
        frames={Infinity}
        temporal
        blend={100}
      >
        <RandomizedLight
          amount={8}
          radius={1}
          ambient={0.5}
          intensity={1}
          position={[1, 2, 3]}
          bias={0.001}
        />
      </AccumulativeShadows> */}
      <directionalLight
        ref={directionalLightRef}
        castShadow
        position={sunPosition}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-camera-top={5}
        shadow-camera-right={5}
        shadow-camera-bottom={-5}
        shadow-camera-left={-5}
      />

      <ambientLight intensity={0.5} />
      {/* <Sky sunPosition={sunPosition} /> */}

      <group>
        <PivotControls
          anchor={[0, 0, 0]}
          depthTest={false}
          lineWidth={4}
          axisColors={['#9381ff', '#ff4d6d', '#7ae582']}
          scale={100}
          fixed={true}
        >
          <mesh
            ref={sphereRef}
            position={[sphereOptions.position.x, sphereOptions.position.y, 0]}
            visible={sphereOptions.visible}
            castShadow
            envMapIntensity={envMapIntensity}
          >
            <sphereGeometry />
            <meshStandardMaterial
              color={sphereOptions.color}
              envMapIntensity={envMapIntensity}
            />
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

        <mesh ref={cubeRef} scale={cubeOptions.scale} position-x={2} castShadow>
          <boxGeometry />
          <meshStandardMaterial
            color="mediumpurple"
            envMapIntensity={envMapIntensity}
          />
        </mesh>
        <TransformControls object={cubeRef} mode="translate" />
      </group>

      <mesh
        receiveShadow
        position-y={-1}
        rotation-x={-Math.PI * 10.5}
        scale={10}
      >
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
