import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { BrickTile } from './BrickTile';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocation } from 'react-router-dom';
import { useVisualLab } from './VisualLabContext';

gsap.registerPlugin(ScrollTrigger);

function AnimatedBrick() {
  const wrapperRef = useRef<THREE.Group>(null);
  const brickRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const interactiveRef = useRef<THREE.Group>(null);

  const { setCurrentSection, isCustomizeMode, isEstimating } = useVisualLab();
  const currentSection = useRef('hero');
  const isTransitioning = useRef(false);
  const isDragging = useRef(false);
  const isHovered = useRef(false);
  const previousPointer = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const heroRotationRef = useRef<gsap.core.Tween | null>(null);
  const isHiddenInCatalog = useRef(false);
  const location = useLocation();

  useFrame((state, delta) => {
    // ── Visibility: MUST happen before any early returns ──
    if (wrapperRef.current) {
      if (location.pathname === '/' && !isCustomizeMode) {
        wrapperRef.current.visible = false;
      } else {
        wrapperRef.current.visible = !isHiddenInCatalog.current;
      }
    }

    if (!interactiveRef.current) return;

    interactiveRef.current.rotation.y = THREE.MathUtils.damp(
      interactiveRef.current.rotation.y,
      targetRotation.current.y,
      isDragging.current ? 15 : 5,
      delta
    );
    interactiveRef.current.rotation.x = THREE.MathUtils.damp(
      interactiveRef.current.rotation.x,
      targetRotation.current.x,
      isDragging.current ? 15 : 5,
      delta
    );

    if (spinRef.current) {
      if ((currentSection.current === 'technical' || currentSection.current === 'showcase' || currentSection.current === 'premium') && !isDragging.current) {
        spinRef.current.rotation.y -= delta * 0.12;
      } else if (currentSection.current !== 'hero') {
        const currentY = spinRef.current.rotation.y;
        const targetY = Math.round(currentY / (Math.PI * 2)) * (Math.PI * 2);
        spinRef.current.rotation.y = THREE.MathUtils.damp(spinRef.current.rotation.y, targetY, 2, delta);
      }
    }
  });

  useEffect(() => {
    if (!wrapperRef.current || !brickRef.current) return;
    const wrapper = wrapperRef.current;
    const brick = brickRef.current;
    
    // Only bind ScrollTrigger and setup positions if we are on a page that needs it
    if (location.pathname === '/' && !isCustomizeMode) return;

    let mm = gsap.matchMedia();

    // Continuous slow rotation in Hero (applied to wrapper)
    heroRotationRef.current = gsap.to(wrapper.rotation, {
      y: 0.15,
      x: 0.05,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      paused: true
    });
    const heroFloat = gsap.to(wrapper.position, {
      y: 0.1,
      duration: 3.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      paused: true
    });

    if (!isCustomizeMode) {
      const sectionsWithRotation = ["#hero", "#product-journey"];
      sectionsWithRotation.forEach(trigger => {
        ScrollTrigger.create({
          trigger: trigger,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => { 
            if (!isDragging.current) heroRotationRef.current?.play(); 
            heroFloat.play(); 
          },
          onLeave: () => { heroRotationRef.current?.pause(); heroFloat.pause(); },
          onEnterBack: () => { 
            if (!isDragging.current) heroRotationRef.current?.play(); 
            heroFloat.play(); 
          },
          onLeaveBack: () => { heroRotationRef.current?.pause(); heroFloat.pause(); },
        });
      });
    }

    const getUpdateHandler = (prevSection: string, nextSection: string) => (self: any) => {
      if (self.progress > 0 && self.progress < 1) {
        isTransitioning.current = true;
        if (isDragging.current) {
          isDragging.current = false;
          targetRotation.current = { x: 0, y: 0 };
          document.body.style.cursor = 'auto';
        }
      } else {
        isTransitioning.current = false;
        const newSection = self.progress === 0 ? prevSection : nextSection;
        if (currentSection.current !== newSection) {
          currentSection.current = newSection;
          setCurrentSection(newSection);
        }
      }
    };



    mm.add({
      isDesktop: "(min-width: 768px)",
      isMobile: "(max-width: 767px)"
    }, (context) => {
      let { isDesktop } = context.conditions as any;

      // ── Journey Presets ─────────────────────────────────────────────────
      // 1. Hero: Center, rotating axis
      const heroPreset = isDesktop 
        ? { position: { x: 0, y: -0.2, z: 0 }, rotation: { x: 0.1, y: 0.3, z: 0 }, scale: { x: 0.85, y: 0.85, z: 0.85 } }
        : { position: { x: 0, y: -0.2, z: 0 }, rotation: { x: 0.1, y: 0.3, z: 0 }, scale: { x: 0.75, y: 0.75, z: 0.75 } };

      // 2. Catalog (Colour Moods): Invisible
      const catalogPreset = { position: { x: 0, y: 0, z: -12 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0, y: 0, z: 0 } };

      // 3. Product Journey (Selected Tile View): Center
      const journeyPreset = isDesktop
        ? { position: { x: 0, y: -0.1, z: 1.0 }, rotation: { x: 0.08, y: 0.2, z: 0 }, scale: { x: 1.3, y: 1.3, z: 1.3 } }
        : { position: { x: 0, y: 0, z: 0.4 }, rotation: { x: 0.08, y: 0.15, z: 0 }, scale: { x: 1.0, y: 1.0, z: 1.0 } };

      // 4. Material Story (Fired Clay): Right Hand Side
      const materialPreset = isDesktop
        ? { position: { x: 2.2, y: 0.2, z: 0.8 }, rotation: { x: 0.2, y: -0.6, z: 0.05 }, scale: { x: 1.2, y: 1.2, z: 1.2 } }
        : { position: { x: 1.2, y: 0, z: 0.4 }, rotation: { x: 0.1, y: -0.4, z: 0 }, scale: { x: 0.9, y: 0.9, z: 0.9 } };

      // 5. Delivery Process: Left Hand Side  
      const deliveryPreset = isDesktop
        ? { position: { x: -2.0, y: 0, z: 1.2 }, rotation: { x: 0.3, y: 0.9, z: -0.15 }, scale: { x: 1.5, y: 1.5, z: 1.5 } }
        : { position: { x: 0, y: 1.8, z: 1.2 }, rotation: { x: 0.4, y: 0.8, z: -0.2 }, scale: { x: 1.35, y: 1.35, z: 1.35 } };

      // 6. Technical Spotlight (Material Analysis): Center
      const technicalPreset = isDesktop 
        ? { position: { x: 0, y: 0.1, z: 0.5 }, rotation: { x: 0.08, y: 0, z: 0 }, scale: { x: 1.1, y: 1.1, z: 1.1 } }
        : { position: { x: 0, y: 0.1, z: 0.5 }, rotation: { x: 0.08, y: 0, z: 0 }, scale: { x: 0.85, y: 0.85, z: 0.85 } };

      // Presets for unrelated modes
      const visualLabPreset = isDesktop 
        ? { position: { x: 3, y: -1.5, z: 0 }, rotation: { x: 0.2, y: -0.4, z: 0 }, scale: { x: 0.6, y: 0.6, z: 0.6 } }
        : { position: { x: 0.8, y: -1.5, z: 0 }, rotation: { x: 0.2, y: -0.4, z: 0 }, scale: { x: 0.5, y: 0.5, z: 0.5 } };

      if (isCustomizeMode) {
        gsap.to(brick.position, { ...visualLabPreset.position, duration: 1.2, ease: "power3.inOut" });
        gsap.to(brick.rotation, { ...visualLabPreset.rotation, duration: 1.2, ease: "power3.inOut" });
        gsap.to(brick.scale, { ...visualLabPreset.scale, duration: 1.2, ease: "power3.inOut" });
        setCurrentSection('visual-lab');
        heroRotationRef.current?.pause();
        heroFloat.pause();
        return;
      }

      // ── Ensure tile is visible and at hero position on init ──
      isHiddenInCatalog.current = false;
      if (wrapperRef.current) wrapperRef.current.visible = true;

      // Animate in smoothly instead of dropping into place instantly
      gsap.fromTo(brick.position, 
        { ...catalogPreset.position }, // Start from a hidden, deep z-index position
        { ...heroPreset.position, duration: 1.5, ease: "power3.out" }
      );
      gsap.fromTo(brick.rotation,
        { ...heroPreset.rotation, x: heroPreset.rotation.x + 0.5 },
        { ...heroPreset.rotation, duration: 1.5, ease: "power3.out" }
      );
      gsap.fromTo(brick.scale,
        { x: 0, y: 0, z: 0 },
        { ...heroPreset.scale, duration: 1.5, ease: "back.out(1.5)" }
      );

      // ── CATALOG SECTION: Hide tile completely using visibility flag ──
      // Uses onEnter/onLeave callbacks — NOT scrub — so it's instant and reliable
      ScrollTrigger.create({
        trigger: "#catalog",
        start: "top 85%",
        end: "bottom 15%",
        onEnter:     () => { isHiddenInCatalog.current = true; },
        onLeave:     () => { isHiddenInCatalog.current = false; },
        onEnterBack: () => { isHiddenInCatalog.current = true; },
        onLeaveBack: () => { isHiddenInCatalog.current = false; },
      });

      // ── PRODUCT JOURNEY: Tile fades in center, large ──
      // Animate FROM heroPreset (tile was last at hero) TO journeyPreset
      const tl2 = gsap.timeline({
        scrollTrigger: {
          trigger: "#product-journey",
          start: "top 60%",
          end: "center center",
          scrub: 2,
          onUpdate: getUpdateHandler('catalog', 'journey')
        }
      });
      tl2.fromTo(brick.position, heroPreset.position,  { ...journeyPreset.position, ease: "power2.out" }, 0);
      tl2.fromTo(brick.rotation, heroPreset.rotation,  { ...journeyPreset.rotation, ease: "power2.out" }, 0);
      tl2.fromTo(brick.scale,    heroPreset.scale,     { ...journeyPreset.scale,    ease: "power2.out" }, 0);

      // ── Step 3: Product Journey → Material Story (tile to RIGHT) ──
      const tl3 = gsap.timeline({
        scrollTrigger: {
          trigger: "#material-story",
          start: "top bottom",
          end: "center center",
          scrub: 1.5,
          onUpdate: getUpdateHandler('journey', 'material')
        }
      });
      tl3.fromTo(brick.position, journeyPreset.position, { ...materialPreset.position, ease: "power2.inOut", immediateRender: false }, 0);
      tl3.fromTo(brick.rotation, journeyPreset.rotation, { ...materialPreset.rotation, ease: "power2.inOut", immediateRender: false }, 0);
      tl3.fromTo(brick.scale,    journeyPreset.scale,    { ...materialPreset.scale,    ease: "power2.inOut", immediateRender: false }, 0);

      // ── Step 4: Material Story → Delivery (tile to LEFT) ──
      const tl4 = gsap.timeline({
        scrollTrigger: {
          trigger: "#delivery-process",
          start: "top bottom",
          end: "center center",
          scrub: 1.5,
          onUpdate: getUpdateHandler('material', 'delivery')
        }
      });
      tl4.fromTo(brick.position, materialPreset.position, { ...deliveryPreset.position, ease: "power2.inOut", immediateRender: false }, 0);
      tl4.fromTo(brick.rotation, materialPreset.rotation, { ...deliveryPreset.rotation, ease: "power2.inOut", immediateRender: false }, 0);
      tl4.fromTo(brick.scale,    materialPreset.scale,    { ...deliveryPreset.scale,    ease: "power2.inOut", immediateRender: false }, 0);

      // ── Step 5: Delivery → Technical / Material Analysis (tile to CENTER) ──
      const tl5 = gsap.timeline({
        scrollTrigger: {
          trigger: "#technical-spotlight",
          start: "top bottom",
          end: "center center",
          scrub: 1.5,
          onUpdate: getUpdateHandler('delivery', 'technical')
        }
      });
      tl5.fromTo(brick.position, deliveryPreset.position, { ...technicalPreset.position, ease: "power2.inOut", immediateRender: false }, 0);
      tl5.fromTo(brick.rotation, deliveryPreset.rotation, { ...technicalPreset.rotation, ease: "power2.inOut", immediateRender: false }, 0);
      tl5.fromTo(brick.scale,    deliveryPreset.scale,    { ...technicalPreset.scale,    ease: "power2.inOut", immediateRender: false }, 0);

      // ── Step 6: Technical → Showcase (tile hides, journey ends) ──
      const tl6 = gsap.timeline({
        scrollTrigger: {
          trigger: "#showcase",
          start: "top bottom",
          end: "center center",
          scrub: 1.5,
          onUpdate: getUpdateHandler('technical', 'showcase')
        }
      });
      tl6.to(brick.position, { ...catalogPreset.position, ease: "power2.inOut", immediateRender: false }, 0);
      tl6.to(brick.rotation, { ...catalogPreset.rotation, ease: "power2.inOut", immediateRender: false }, 0);
      tl6.to(brick.scale,    { ...catalogPreset.scale,    ease: "power2.inOut", immediateRender: false }, 0);


      // Step 7: Premium Showcase — tile is hidden above, PremiumShowcaseSection manages its own canvas
    });


    return () => {
      mm.revert();
      heroRotationRef.current?.kill();
      heroFloat.kill();
    };
  }, [isCustomizeMode, setCurrentSection, location.pathname]);

  useEffect(() => {
    if (!brickRef.current) return;
    const brick = brickRef.current;
    
    const updatePose = () => {
      const isMobile = window.innerWidth < 768;
      
      if (currentSection.current === 'technical') {
        if (isEstimating) {
          // Lateral Flow Pose: Shifted left with parallax
          gsap.to(brick.position, { 
            x: isMobile ? 0 : -3.2, 
            y: isMobile ? 1.4 : 0, 
            z: isMobile ? 0.8 : 0.8, 
            duration: 1.8, 
            ease: "expo.inOut" 
          });
          gsap.to(brick.rotation, { 
            x: isMobile ? 0.4 : 0.1, 
            y: isMobile ? 0.2 : 0.8, 
            z: 0, 
            duration: 1.8, 
            ease: "expo.inOut" 
          });
          gsap.to(brick.scale, { 
            x: isMobile ? 0.6 : 0.65, 
            y: isMobile ? 0.6 : 0.65, 
            z: isMobile ? 0.6 : 0.65, 
            duration: 1.8, 
            ease: "expo.inOut" 
          });
        } else {
          // Return to Specs Pose
          gsap.to(brick.position, { x: 0, y: 0, z: 0, duration: 1.6, ease: "expo.out" });
          gsap.to(brick.rotation, { x: 0, y: 0, z: 0, duration: 1.6, ease: "expo.out" });
          gsap.to(brick.scale, { x: isMobile ? 0.9 : 1, y: isMobile ? 0.9 : 1, z: isMobile ? 0.9 : 1, duration: 1.6, ease: "expo.out" });
        }
      }
    };

    updatePose();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updatePose);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updatePose);
      }
    };
  }, [isEstimating]);

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    isHovered.current = true;
    if (isTransitioning.current) return;
    if (currentSection.current !== 'hero') return;
    if (!isDragging.current) document.body.style.cursor = 'grab';
  };

  const handlePointerOut = (e: any) => {
    isHovered.current = false;
    if (isDragging.current) return;
    document.body.style.cursor = 'auto';
  };

  const handlePointerDown = (e: any) => {
    if (isTransitioning.current) return;
    if (currentSection.current !== 'hero') return;
    
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    isDragging.current = true;
    previousPointer.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
    
    if (heroRotationRef.current) heroRotationRef.current.pause();
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    
    const deltaX = e.clientX - previousPointer.current.x;
    const deltaY = e.clientY - previousPointer.current.y;
    previousPointer.current = { x: e.clientX, y: e.clientY };
    
    targetRotation.current.y += deltaX * 0.01;
    targetRotation.current.x += deltaY * 0.01;
    
    targetRotation.current.x = THREE.MathUtils.clamp(targetRotation.current.x, -0.2, 0.2);
  };

  const handlePointerUp = (e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    e.target.releasePointerCapture(e.pointerId);
    isDragging.current = false;
    targetRotation.current = { x: 0, y: 0 };
    
    if (isHovered.current && !isTransitioning.current && currentSection.current === 'hero') {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = 'auto';
    }
    
    if (currentSection.current === 'hero' && heroRotationRef.current) {
      heroRotationRef.current.play();
    }
  };

  return (
    <group ref={wrapperRef}>
      <group ref={brickRef}>
        <group ref={spinRef} scale={0.75}>
          <group 
            ref={interactiveRef}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <BrickTile />
          </group>
        </group>
      </group>
    </group>
  );
}

function LightingController() {
  const { currentSection, activeLighting } = useVisualLab();
  const isVisualLab = currentSection === 'visual-lab';

  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLight1Ref = useRef<THREE.SpotLight>(null);
  const rimLight2Ref = useRef<THREE.PointLight>(null);

  const targetKeyColor = useRef(new THREE.Color("#fff0e6"));
  const targetFillColor = useRef(new THREE.Color("#e6f0ff"));

  useFrame((state, delta) => {
    // Default lighting values (cinematic, no blowout)
    let targetKeyIntensity = 1.8;
    targetKeyColor.current.set("#fff0e6");
    let targetFillIntensity = 1.0;
    targetFillColor.current.set("#e6f0ff");
    let targetRim1Intensity = 2.5;
    let targetRim2Intensity = 1.5;

    if (isVisualLab) {
      if (activeLighting === 'daylight') {
        targetKeyIntensity = 2.5;
        targetKeyColor.current.set("#ffffff");
        targetFillIntensity = 1.5;
        targetFillColor.current.set("#f0f8ff");
        targetRim1Intensity = 0.8;
        targetRim2Intensity = 0.4;
      } else if (activeLighting === 'interior') {
        targetKeyIntensity = 1.2;
        targetKeyColor.current.set("#ffaa66");
        targetFillIntensity = 0.4;
        targetFillColor.current.set("#442211");
        targetRim1Intensity = 2.0;
        targetRim2Intensity = 1.5;
      }
    } else {
      // Dynamic lighting based on section
      if (currentSection === 'catalog') {
        targetKeyIntensity = 0;
        targetFillIntensity = 0;
        targetRim1Intensity = 0;
        targetRim2Intensity = 0;
      } else if (currentSection === 'journey') {
        targetKeyIntensity = 2.0;
        targetKeyColor.current.set("#ffffff");
        targetFillIntensity = 1.0;
        targetFillColor.current.set("#f0f8ff");
        targetRim1Intensity = 1.5;
        targetRim2Intensity = 0.8;
      } else if (currentSection === 'material') {
        targetKeyIntensity = 2.2;
        targetKeyColor.current.set("#ffffff");
        targetFillIntensity = 1.2;
        targetFillColor.current.set("#f0f8ff");
        targetRim1Intensity = 0.8;
        targetRim2Intensity = 0.4;
      } else if (currentSection === 'delivery') {
        targetKeyIntensity = 2.0;
        targetKeyColor.current.set("#ffffff");
        targetFillIntensity = 0.8;
        targetFillColor.current.set("#f0f8ff");
        targetRim1Intensity = 2.0;
        targetRim2Intensity = 0.8;
      } else if (currentSection === 'technical') {
        targetKeyIntensity = 2.0;
        targetKeyColor.current.set("#ffffff");
        targetFillIntensity = 1.0;
        targetFillColor.current.set("#f0f8ff");
        targetRim1Intensity = 1.5;
        targetRim2Intensity = 0.8;
      }
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.damp(keyLightRef.current.intensity, targetKeyIntensity, 4, delta);
      keyLightRef.current.color.lerp(targetKeyColor.current, delta * 4);
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.damp(fillLightRef.current.intensity, targetFillIntensity, 4, delta);
      fillLightRef.current.color.lerp(targetFillColor.current, delta * 4);
    }
    if (rimLight1Ref.current) {
      rimLight1Ref.current.intensity = THREE.MathUtils.damp(rimLight1Ref.current.intensity, targetRim1Intensity, 4, delta);
    }
    if (rimLight2Ref.current) {
      rimLight2Ref.current.intensity = THREE.MathUtils.damp(rimLight2Ref.current.intensity, targetRim2Intensity, 4, delta);
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight ref={keyLightRef} position={[3, 6, 5]} intensity={1.8} color="#fff0e6" castShadow />
      <directionalLight ref={fillLightRef} position={[-4, -1, 5]} intensity={1.0} color="#e6f0ff" />
      <spotLight ref={rimLight1Ref} position={[-4, 4, -4]} angle={0.5} penumbra={0.8} intensity={2.5} color="#ffffff" />
      <pointLight ref={rimLight2Ref} position={[4, -4, -4]} intensity={1.5} color="#ffccaa" />
    </>
  );
}

export function ProductScene() {
  const cameraRef = useRef<any>(null);
  const location = useLocation();

  if (location.pathname.startsWith('/portal') || location.pathname.startsWith('/studio/creative')) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      <Canvas
        shadows={false}
        dpr={Math.min(window.devicePixelRatio, 1.5)}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: true,
        }}
        eventSource={document.getElementById('root') || undefined}
        eventPrefix="client"
      >
        <Suspense fallback={null}>
          <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 5]} fov={45} />
          
          <LightingController />
          
          <AnimatedBrick />
        </Suspense>
      </Canvas>
    </div>
  );
}
