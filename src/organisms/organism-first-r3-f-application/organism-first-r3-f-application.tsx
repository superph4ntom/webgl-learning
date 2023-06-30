import { useFrame } from '@react-three/fiber';
import styles from './organism-first-r3-f-application.module.scss';

export default function OrganismFirstR3FApplication() {
  useFrame(() => {
    console.log('tick');
  });

  return (
    <>
      <mesh position-y={-1} rotation-x={-Math.PI * 0.5} scale={10}>
        <planeGeometry />
        <meshBasicMaterial color="greenyellow" />
      </mesh>
      <mesh position-x={-2}>
        <sphereGeometry />
        <meshBasicMaterial color="orange" />
      </mesh>
      <mesh rotation-y={Math.PI * 0.25} position-x={2} scale={1.5}>
        <boxGeometry scale={1.5} />
        <meshBasicMaterial color="mediumpurple" />
      </mesh>
    </>
  );
}
