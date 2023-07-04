export default function CustomObject() {
  const verticesCount = 10 * 3;
  const positions = new Float32Array(verticesCount * 3);

  for (let index = 0; index < verticesCount * 3; index += 1) {
    positions[index] = (Math.random() - 0.5) * 3;
  }

  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={verticesCount}
          itemSize={3}
          array={positions}
        />
      </bufferGeometry>
      <meshBasicMaterial color="red" />
    </mesh>
  );
}
