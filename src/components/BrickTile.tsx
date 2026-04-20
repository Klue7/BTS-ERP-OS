import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { createBrickTexture, createBumpTexture, createPavingTexture, createPavingBumpTexture } from '../utils/textureGenerator';
import { useVisualLab } from './VisualLabContext';
import { useFrame } from '@react-three/fiber';
import { onBeforeCompileBrick } from '../utils/proceduralShader';
import { useStorefrontCategoryData } from '../catalog/storefrontData';

// Memoised so it never re-renders due to unrelated context changes
export const BrickTile = React.memo(function BrickTile(props: any) {
  const group = useRef<THREE.Group>(null);
  const { activeCategory, selectedCatalogItem } = useVisualLab();
  const meshRef = useRef<any>(null);
  const { categoryData } = useStorefrontCategoryData(activeCategory);
  const [faceTexture, setFaceTexture] = useState<THREE.Texture | null>(null);
  
  // Textures are cached singletons — this lookup is instantaneous
  const [colorMap, bumpMap, pavingColorMap, pavingBumpMap] = useMemo(() => [
    createBrickTexture(), 
    createBumpTexture(),
    createPavingTexture(),
    createPavingBumpTexture()
  ], []);

  const catalogItems = categoryData?.catalog ?? [];
  const resolvedCatalogItem = useMemo(() => {
    if (!selectedCatalogItem) {
      return catalogItems[0] ?? null;
    }

    const matched =
      catalogItems.find((item: any) => item.inventoryProductId && item.inventoryProductId === selectedCatalogItem.inventoryProductId) ??
      catalogItems.find((item: any) => item.publicSku && item.publicSku === selectedCatalogItem.publicSku) ??
      catalogItems.find((item: any) => item.id === selectedCatalogItem.id) ??
      null;

    return matched ? { ...selectedCatalogItem, ...matched } : selectedCatalogItem;
  }, [catalogItems, selectedCatalogItem]);

  // Target depth and dimensions based on category
  const targetDepth  = activeCategory === 'breeze-blocks' ? 1.0 : activeCategory === 'bricks' ? 1.0 : activeCategory === 'paving' ? 0.5 : 0.14;
  const targetWidth  = activeCategory === 'breeze-blocks' ? 2.0 : activeCategory === 'paving' ? 2.0 : 2.2;
  const targetHeight = activeCategory === 'breeze-blocks' ? 2.0 : activeCategory === 'paving' ? 1.0 : 0.73;
  const tileColor    = resolvedCatalogItem?.color || (activeCategory === 'breeze-blocks' ? '#ef4444' : '#ffffff');
  const faceImageUrl = resolvedCatalogItem?.faceImageUrl ?? resolvedCatalogItem?.image ?? resolvedCatalogItem?.images?.[0] ?? null;

  useEffect(() => {
    if (!faceImageUrl || activeCategory === 'breeze-blocks') {
      setFaceTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    let isActive = true;

    loader.load(
      faceImageUrl,
      (texture) => {
        if (!isActive) return;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = 8;
        setFaceTexture(texture);
      },
      undefined,
      () => {
        if (isActive) {
          setFaceTexture(null);
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, [activeCategory, faceImageUrl]);

  const texturedFaceMaps = useMemo(() => {
    if (!faceTexture || activeCategory === 'breeze-blocks') {
      return null;
    }

    const createVariant = (configure?: (texture: THREE.Texture) => void) => {
      const texture = faceTexture.clone();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = faceTexture.anisotropy;
      configure?.(texture);
      texture.needsUpdate = true;
      return texture;
    };

    return {
      front: createVariant(),
      back: createVariant((texture) => {
        texture.repeat.set(-1, 1);
        texture.offset.set(1, 0);
      }),
      side: createVariant((texture) => {
        texture.repeat.set(0.14, 1);
        texture.offset.set(0.43, 0);
      }),
      top: createVariant((texture) => {
        texture.repeat.set(1, 0.18);
        texture.offset.set(0, 0.41);
      }),
      bottom: createVariant((texture) => {
        texture.repeat.set(1, -0.18);
        texture.offset.set(0, 0.59);
      }),
    };
  }, [activeCategory, faceTexture]);

  const breezeBlockGeometry = useMemo(() => {
    const size = 2.0;
    const thickness = 0.2;
    const shape = new THREE.Shape();
    shape.moveTo(-size/2, -size/2);
    shape.lineTo(size/2, -size/2);
    shape.lineTo(size/2, size/2);
    shape.lineTo(-size/2, size/2);
    shape.closePath();

    const hole1 = new THREE.Path();
    hole1.moveTo(-size/2 + thickness, size/2 - thickness);
    hole1.lineTo(size/2 - thickness, size/2 - thickness);
    hole1.quadraticCurveTo(0, 0, -size/2 + thickness, -size/2 + thickness + 0.4);
    hole1.closePath();

    const hole2 = new THREE.Path();
    hole2.moveTo(-size/2 + thickness, -size/2 + thickness);
    hole2.lineTo(size/2 - thickness, -size/2 + thickness);
    hole2.quadraticCurveTo(0, 0, size/2 - thickness, size/2 - thickness - 0.4);
    hole2.closePath();

    shape.holes.push(hole1, hole2);

    const extrudeSettings = {
      depth: 1.0,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center the geometry on the Z axis
    geom.translate(0, 0, -0.5);
    return geom;
  }, []);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    if (activeCategory === 'breeze-blocks') {
      meshRef.current.scale.z = THREE.MathUtils.damp(meshRef.current.scale.z, 1, 4, delta);
      meshRef.current.scale.x = THREE.MathUtils.damp(meshRef.current.scale.x, 1, 4, delta);
      meshRef.current.scale.y = THREE.MathUtils.damp(meshRef.current.scale.y, 1, 4, delta);
    } else {
      meshRef.current.scale.z = THREE.MathUtils.damp(meshRef.current.scale.z, targetDepth / 0.14, 4, delta);
      meshRef.current.scale.x = THREE.MathUtils.damp(meshRef.current.scale.x, targetWidth  / 2.2,  4, delta);
      meshRef.current.scale.y = THREE.MathUtils.damp(meshRef.current.scale.y, targetHeight / 0.73, 4, delta);
    }
  });

  return (
    <group ref={group} {...props}>
      <group ref={meshRef}>
        {activeCategory === 'breeze-blocks' ? (
          <mesh geometry={breezeBlockGeometry}>
            <meshPhysicalMaterial 
              map={colorMap} 
              bumpMap={bumpMap}
              bumpScale={0.08}
              roughness={0.92}
              metalness={0.05}
              clearcoat={0.05}
              clearcoatRoughness={0.95}
              color={tileColor}
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'breeze_' + tileColor}
            />
          </mesh>
        ) : texturedFaceMaps ? (
          <mesh>
            <boxGeometry args={[2.2, 0.73, 0.14]} />
            <meshPhysicalMaterial
              attach="material-0"
              map={texturedFaceMaps.side}
              bumpMap={bumpMap}
              bumpScale={0.035}
              roughness={0.92}
              metalness={0.02}
              clearcoat={0.03}
              color="#ffffff"
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'textured_side_right_' + faceImageUrl}
            />
            <meshPhysicalMaterial
              attach="material-1"
              map={texturedFaceMaps.side}
              bumpMap={bumpMap}
              bumpScale={0.035}
              roughness={0.92}
              metalness={0.02}
              clearcoat={0.03}
              color="#ffffff"
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'textured_side_left_' + faceImageUrl}
            />
            <meshPhysicalMaterial
              attach="material-2"
              map={texturedFaceMaps.top}
              bumpMap={bumpMap}
              bumpScale={0.03}
              roughness={0.9}
              metalness={0.02}
              clearcoat={0.02}
              color="#ffffff"
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'textured_top_' + faceImageUrl}
            />
            <meshPhysicalMaterial
              attach="material-3"
              map={texturedFaceMaps.bottom}
              bumpMap={bumpMap}
              bumpScale={0.03}
              roughness={0.96}
              metalness={0.01}
              clearcoat={0.01}
              color="#ffffff"
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'textured_bottom_' + faceImageUrl}
            />
            <meshPhysicalMaterial
              attach="material-4"
              map={texturedFaceMaps.front}
              bumpMap={bumpMap}
              bumpScale={0.04}
              roughness={0.86}
              metalness={0.02}
              clearcoat={0.04}
              color="#ffffff"
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'textured_front_' + faceImageUrl}
            />
            <meshPhysicalMaterial
              attach="material-5"
              map={texturedFaceMaps.back}
              bumpMap={bumpMap}
              bumpScale={0.04}
              roughness={0.88}
              metalness={0.02}
              clearcoat={0.03}
              color="#ffffff"
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'textured_back_' + faceImageUrl}
            />
          </mesh>
        ) : (
          <RoundedBox args={[2.2, 0.73, 0.14]} radius={0.035} smoothness={4}>
            {activeCategory === 'paving' ? (
            <meshPhysicalMaterial 
              map={pavingColorMap} 
              bumpMap={pavingBumpMap}
              bumpScale={0.05}
              roughness={0.94}
              metalness={0.02}
              clearcoat={0.04}
              color={tileColor}
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'paving_' + tileColor}
            />
          ) : (
            <meshPhysicalMaterial 
              map={colorMap} 
              bumpMap={bumpMap}
              bumpScale={0.08}
              roughness={0.90}
              metalness={0.05}
              clearcoat={0.05}
              clearcoatRoughness={0.95}
              color={tileColor}
              onBeforeCompile={onBeforeCompileBrick}
              customProgramCacheKey={() => 'brick_' + tileColor}
            />
            )}
          </RoundedBox>
        )}
      </group>
    </group>
  );
});
