import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Cylinder } from '@react-three/drei';

export function Pedestal3D(props: any) {
  const group = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      // Subtle pulsing of the light ring
      const time = state.clock.getElapsedTime();
      const material = ringRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1.0 + Math.sin(time * 2) * 0.3;
    }
  });

  return (
    <group ref={group} {...props}>
      {/* Base cylinder (large dark metallic) */}
      <Cylinder args={[1.5, 1.8, 0.4, 64]} position={[0, -0.2, 0]} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#0a0a0d" 
          roughness={0.15} 
          metalness={0.9} 
          envMapIntensity={2}
        />
      </Cylinder>

      {/* Mid cylinder (slightly smaller and darker) */}
      <Cylinder args={[1.2, 1.2, 0.4, 64]} position={[0, 0.2, 0]} receiveShadow castShadow>
        <meshStandardMaterial 
          color="#050505" 
          roughness={0.1} 
          metalness={0.95} 
        />
      </Cylinder>

      {/* Glowing inner ring rim */}
      <Cylinder ref={ringRef} args={[1.21, 1.21, 0.1, 64]} position={[0, 0.4, 0]}>
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={1.5} 
          toneMapped={false} 
        />
      </Cylinder>

      {/* Top cap (glass-like clearcoat) */}
      <Cylinder args={[1.15, 1.15, 0.05, 64]} position={[0, 0.41, 0]} receiveShadow>
        <meshPhysicalMaterial 
          color="#000000" 
          roughness={0.05} 
          metalness={1.0} 
          clearcoat={1.0} 
          clearcoatRoughness={0.0} 
          envMapIntensity={2.0} 
        />
      </Cylinder>
    </group>
  );
}
