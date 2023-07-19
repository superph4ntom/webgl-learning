import { useMemo, useRef, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import { DoubleSide } from 'three';

export default function CustomObject() {
  const geometryRef: MutableRefObject<any> = useRef();

  const verticesCount = 10 * 3;

  const positions = useMemo(() => {
    const positions = new Float32Array(verticesCount * 3);

    for (let index = 0; index < verticesCount * 3; index += 1) {
      positions[index] = (Math.random() - 0.5) * 3;
    }

    return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    geometryRef.current.computeVertexNormals();
  }, []);

  return (
    <mesh>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={verticesCount}
          itemSize={3}
          array={positions}
        />
      </bufferGeometry>
      <meshStandardMaterial color="red" side={DoubleSide} />
    </mesh>
  );
}
