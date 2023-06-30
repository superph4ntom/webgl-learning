import Head from 'next/head';
import { Canvas } from '@react-three/fiber';
import OrganismFirstR3FApplication from '@/organisms/organism-first-r3-f-application/organism-first-r3-f-application';
import styles from './index.module.scss';

export default function Home() {
  return (
    <>
      <Head>
        <title>WebGL</title>
        <meta name="description" content="A unique MetaHuman experience." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <Canvas
          style={{ position: 'relative', width: '100vw', height: '100vh' }}
        >
          <OrganismFirstR3FApplication />
        </Canvas>
      </div>
    </>
  );
}
