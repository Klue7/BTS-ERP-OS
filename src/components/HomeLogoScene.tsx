import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Enhanced side-layering approach that preserves the original materials/textures 
 * of the mesh to avoid turning it into a flat gray rectangle.
 */
function ThickLogoMesh({ scene }: { scene: THREE.Group }) {
  const frontRef = useRef<THREE.Group>(null);
  
  const THICKNESS = 0.12; // Deeper thickness requested
  const SIDE_STEPS = 50;  // High slice count to completely eliminate gaps

  // Maintain original material maps but darken the layers slightly to create depth illusion
  const sideMeshes = useMemo(() => {
    return Array.from({ length: SIDE_STEPS }).map((_, i) => {
      const clone = scene.clone(true);
      const t = (i + 1) / (SIDE_STEPS + 1);
      
      clone.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          const origMat = Array.isArray(m.material) ? m.material[0] : m.material;
          if (origMat) {
             const mat = (origMat as THREE.MeshStandardMaterial).clone();
             
             // Multiply existing color with a dark shade to simulate lateral shadow
             const origColor = mat.color || new THREE.Color(1,1,1);
             const darkColor = origColor.clone().multiplyScalar(0.2); 
             mat.color = origColor.clone().lerp(darkColor, t);
             
             // AlphaTest ensures we don't get Z-buffer glitches if the texture has transparency
             mat.alphaTest = 0.5;
             mat.transparent = true;
             mat.depthWrite = true; 
             mat.needsUpdate = true;
             m.material = mat;
          }
        }
      });
      return clone;
    });
  }, [scene]);

  // Front face material enhancement (preserve map, bump up reflections)
  const frontScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        const origMat = Array.isArray(m.material) ? m.material[0] : m.material;
        if (origMat) {
          const mat = (origMat as THREE.MeshStandardMaterial).clone();
          mat.roughness = 0.15;
          mat.metalness = 0.85; 
          mat.envMapIntensity = 1.5;
          mat.alphaTest = 0.5;
          mat.transparent = true;
          mat.depthWrite = true;
          mat.needsUpdate = true;
          m.material = mat;
        }
      }
    });
    return clone;
  }, [scene]);

  return (
    <group>
      {sideMeshes.map((sideScene, i) => (
        <primitive
          key={`side-${i}`}
          object={sideScene}
          position-z={-(THICKNESS * ((i + 1) / SIDE_STEPS))}
        />
      ))}
      <primitive ref={frontRef as any} object={frontScene} position-z={0} />
    </group>
  );
}

function RotatingLogo() {
  const { scene } = useGLTF('/element-2.5d.glb');
  const logoRef = useRef<THREE.Group>(null);
  
  // Interaction states
  const [hovered, setHover] = useState(false);
  const [clicked, setClick] = useState(false);

  // Interaction cursor
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  useFrame((state, delta) => {
    if (logoRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Smooth dynamic scaling based on interaction
      const targetScale = clicked ? 1.9 : hovered ? 2.3 : 2.1;
      logoRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 6);
      
      if (hovered && !clicked) {
        // Parallax tilt tracking mouse
        const targetX = (state.pointer.y * Math.PI) / 6;
        const targetY = (state.pointer.x * Math.PI) / 6;
        
        logoRef.current.rotation.x = THREE.MathUtils.lerp(logoRef.current.rotation.x, targetX, delta * 4);
        logoRef.current.rotation.y = THREE.MathUtils.lerp(logoRef.current.rotation.y, targetY, delta * 4);
      } else if (clicked) {
        // Aggressive spin when held (Reversed)
        logoRef.current.rotation.y -= delta * 6.0;
        logoRef.current.rotation.x = THREE.MathUtils.lerp(logoRef.current.rotation.x, 0, delta * 4);
      } else {
        // Default idle showcase spin (Reversed)
        logoRef.current.rotation.y -= delta * 0.3;
        logoRef.current.rotation.x = THREE.MathUtils.lerp(logoRef.current.rotation.x, 0, delta * 2);
      }
      
      // Floating bob effect
      logoRef.current.position.y = Math.sin(time * 2) * 0.05;
    }
  });

  return (
    <group 
      ref={logoRef} 
      onPointerOver={() => setHover(true)}
      onPointerOut={() => { setHover(false); setClick(false); }}
      onPointerDown={() => setClick(true)}
      onPointerUp={() => setClick(false)}
    >
      <ThickLogoMesh scene={scene} />
    </group>
  );
}

useGLTF.preload('/element-2.5d.glb');

export function HomeLogoScene() {
  return (
    <div className="w-full h-full relative flex items-center justify-center">

      <Canvas
        className="relative z-10"
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 4.5], fov: 42 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <ambientLight intensity={0.6} />
        
        {/* Core lighting */}
        <directionalLight position={[4, 6, 4]} intensity={2.0} color="#ffffff" />
        {/* Fill light reflecting warmth */}
        <directionalLight position={[-4, -2, 3]} intensity={1.0} color="#e5a935" />
        <spotLight position={[0, 8, 2]} intensity={1.5} angle={0.4} penumbra={1} color="#ffffff" />

        <Environment preset="studio" />

        <RotatingLogo />

        {/* Ambient grounding shadow */}
        <ContactShadows
          position={[0, -1.6, 0]}
          opacity={0.4}
          scale={8}
          blur={2.5}
          far={3}
          color="#050505"
        />
      </Canvas>
      
    </div>
  );
}
