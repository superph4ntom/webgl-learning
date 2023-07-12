import Head from 'next/head';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, LinearSRGBColorSpace } from 'three';
import OrganismFirstR3FApplication from '@/organisms/organism-first-r3-f-application/organism-first-r3-f-application';
import OrganismR3fDrei from '@/organisms/organism-r3f-drei/organism-r3f-drei';
import styles from './index.module.scss';
import { Leva } from 'leva';
import { Color } from 'three';

export default function Home() {
  const cameraSettings = {
    OrganismFirstR3FApplication: {
      fov: 45,
      zoom: 1,
      near: 0.1,
      far: 200,
      position: [3, 2, 6] as const,
    },
    OrganismR3fDrei: {
      fov: 45,
      zoom: 1,
      near: 0.1,
      far: 200,
      position: [3, 2, 6] as const,
    },
  };

  return (
    <>
      <Head>
        <title>WebGL</title>
        <meta name="description" content="A unique MetaHuman experience." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.backgroundSky}>
        <Leva collapsed />
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            // toneMapping: ACESFilmicToneMapping,
            // outputColorSpace: LinearSRGBColorSpace,
          }}
          shadows
          camera={cameraSettings.OrganismR3fDrei}
          style={{ position: 'relative', width: '100vw', height: '100vh' }}
        >
          <color args={['ivory']} attach="background" />
          {/* <OrganismFirstR3FApplication /> */}
          <OrganismR3fDrei />
        </Canvas>
      </div>
    </>
  );
}
