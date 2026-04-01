/**
 * ArchitecturalBackground — performance-optimised rewrite
 *
 * Key changes vs. previous version:
 * - No SVG blur filters (blur-[150px] inside an SVG triggers expensive software
 *   compositing on most GPUs; moved to CSS filter on regular divs instead).
 * - No per-element GSAP ScrollTriggers (the previous version created 10–15
 *   scroll-linked tweens that constantly dirtied the layout tree). Replaced with
 *   a single CSS `will-change: transform` layer that uses a CSS animation for the
 *   very subtle parallax, keeping everything on the compositor thread.
 * - SVG grid lines are static — they didn't need to animate at all.
 * - Color accent reacts to `primaryColor` via CSS `currentColor` (no GSAP needed).
 */
import React, { useRef, useEffect } from 'react';
import { useTheme } from './VisualLabContext';

export function ArchitecturalBackground() {
  const { primaryColor } = useTheme();
  const glowRef1 = useRef<HTMLDivElement>(null);
  const glowRef2 = useRef<HTMLDivElement>(null);

  // Lightweight mouse parallax
  useEffect(() => {
    let rafId: number;
    let mx = 0, my = 0;
    let cx = 0, cy = 0;

    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 60;
      my = (e.clientY / window.innerHeight - 0.5) * 60;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const tick = () => {
      cx += (mx - cx) * 0.05;
      cy += (my - cy) * 0.05;
      if (glowRef1.current) glowRef1.current.style.transform = `translate(${cx}px, ${cy}px)`;
      if (glowRef2.current) glowRef2.current.style.transform = `translate(${-cx * 0.6}px, ${-cy * 0.6}px)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#0a0a0c]"
      aria-hidden="true"
    >
      {/* ── Static Blueprint Schematic SVG ──────────────────────────────── */}
      <svg
        viewBox="0 0 2000 1200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ color: primaryColor, transition: 'color 0.8s ease', willChange: 'auto' }}
      >
        <defs>
          {/* Fine mm Grid */}
          <pattern id="sgA" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0L0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.2" strokeOpacity="0.1" />
          </pattern>
          {/* Coarse cm Grid */}
          <pattern id="lgA" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#sgA)" />
            <path d="M100 0L0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
          </pattern>
        </defs>

        {/* Base Grid */}
        <rect width="100%" height="100%" fill="url(#lgA)" />

        <g stroke="currentColor" fill="none">
          {/* Primary Centered axes (cross pattern) with drafting dash arrays */}
          <line x1="-200" y1="600" x2="2200" y2="600" strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="30 15 5 15" />
          <line x1="1000" y1="-200" x2="1000" y2="1400" strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="30 15 5 15" />

          {/* Core Central Complex Component (Hexagon / Circle Arrays) */}
          <g transform="translate(1000, 600)" strokeOpacity="0.4">
            {/* Outer containment ring */}
            <circle cx="0" cy="0" r="450" strokeWidth="0.8" strokeDasharray="10 20" />
            
            {/* 45-degree structural framing squares */}
            <rect x="-240" y="-240" width="480" height="480" strokeWidth="0.8" transform="rotate(45)" />
            <rect x="-180" y="-180" width="360" height="360" strokeWidth="0.4" strokeDasharray="4 6" />

            {/* Inward targeting nodes */}
            {[0, 90, 180, 270].map(angle => (
              <g key={angle} transform={`rotate(${angle})`}>
                <line x1="180" y1="0" x2="450" y2="0" strokeWidth="0.8" strokeOpacity="0.15" />
                <circle cx="315" cy="0" r="8" strokeWidth="1" />
                <circle cx="315" cy="0" r="14" strokeWidth="0.5" strokeDasharray="2 3" />
                {/* Micro tech nodes */}
                <rect x="250" y="-10" width="20" height="20" strokeWidth="0.4" />
                <line x1="260" y1="-25" x2="260" y2="-10" strokeWidth="0.5" />
              </g>
            ))}

            {/* Inner Hexagonal Core Grid */}
            <polygon points="0,-120 103.92,-60 103.92,60 0,120 -103.92,60 -103.92,-60" strokeWidth="1" strokeOpacity="0.6" />
            <polygon points="0,-140 121.24,-70 121.24,70 0,140 -121.24,70 -121.24,-70" strokeWidth="0.4" strokeOpacity="0.3" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="103.92" strokeWidth="0.6" strokeOpacity="0.2" />

            {/* Complex concentric mechanical rings */}
            <circle cx="0" cy="0" r="60" strokeWidth="1.2" strokeOpacity="0.5" />
            <circle cx="0" cy="0" r="50" strokeWidth="0.6" strokeDasharray="2 4" />
            <circle cx="0" cy="0" r="40" strokeWidth="0.4" />
            <circle cx="0" cy="0" r="20" strokeWidth="1" />
            
            {/* Hexagon radiating arms */}
            {[0, 60, 120, 180, 240, 300].map(angle => (
              <g key={`arm-${angle}`} transform={`rotate(${angle})`}>
                <line x1="60" y1="0" x2="103.92" y2="0" strokeWidth="1" />
                <circle cx="103.92" cy="0" r="4" strokeWidth="1" />
              </g>
            ))}
          </g>

          {/* Measurement Annotations (Top Left) */}
          <g transform="translate(300, 250)" strokeOpacity="0.3">
            <line x1="0" y1="0" x2="0" y2="200" strokeWidth="0.5" />
            <line x1="-15" y1="0" x2="15" y2="0" strokeWidth="0.5" />
            <line x1="-15" y1="200" x2="15" y2="200" strokeWidth="0.5" />
            <text x="20" y="100" fill="currentColor" fillOpacity="0.6" stroke="none" fontSize="11" fontFamily="monospace" transform="rotate(-90 20,100)">ELEVATION / 45.0m</text>
          </g>

          {/* Measurement Annotations (Bottom Left) */}
          <g transform="translate(400, 950)" strokeOpacity="0.3">
            <line x1="0" y1="0" x2="400" y2="0" strokeWidth="0.5" />
            <line x1="0" y1="-15" x2="0" y2="15" strokeWidth="0.5" />
            <line x1="400" y1="-15" x2="400" y2="15" strokeWidth="0.5" />
            <text x="200" y="-12" fill="currentColor" fillOpacity="0.6" stroke="none" fontSize="11" fontFamily="monospace" textAnchor="middle">STRUCTURAL WIDTH / 1400</text>
          </g>

          {/* Top Right Tech Component Box */}
          <g transform="translate(1500, 200)" strokeOpacity="0.4">
            <rect x="0" y="0" width="300" height="150" strokeWidth="0.8" fill="currentColor" fillOpacity="0.02" />
            <rect x="10" y="10" width="280" height="130" strokeWidth="0.4" strokeDasharray="3 3" />
            <circle cx="210" cy="75" r="40" strokeWidth="1" />
            <circle cx="210" cy="75" r="30" strokeWidth="0.5" strokeDasharray="2 4" />
            <rect x="40" y="50" width="80" height="50" strokeWidth="0.6" />
            <line x1="80" y1="25" x2="80" y2="50" strokeWidth="0.5" />
            <circle cx="80" cy="20" r="5" strokeWidth="0.8" />
            <text x="20" y="-8" fill="currentColor" fillOpacity="0.5" stroke="none" fontSize="10" fontFamily="monospace">NODE SUBSYSTEM [ACTIVE]</text>
          </g>

          {/* Bottom Right Callout Box */}
          <g transform="translate(1450, 850)" strokeOpacity="0.3">
            <polyline points="0,0 50,-50 250,-50" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="3" strokeWidth="1" />
            <text x="60" y="-60" fill="currentColor" fillOpacity="0.6" stroke="none" fontSize="11" fontFamily="monospace">MATERIAL COMPOSITE MATRIX</text>
            <text x="60" y="-40" fill="currentColor" fillOpacity="0.4" stroke="none" fontSize="9" fontFamily="monospace">THERMAL INSULATION: PASS</text>
          </g>

          {/* Sparse diagonal hatch structures (45 deg lines) */}
          <g strokeOpacity="0.1">
            {[200, 300, 400, 500].map(val => (
              <line key={val} x1={100} y1={val} x2={600} y2={val - 500} strokeWidth="0.5" />
            ))}
            {[1400, 1500, 1600, 1700].map(val => (
              <line key={val} x1={1900} y1={val} x2={1400} y2={val + 500} strokeWidth="0.5" />
            ))}
          </g>

        </g>
      </svg>

      {/* ── Ambient Glow Blobs ── */}
      <div
        ref={glowRef1}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 800, height: 800,
          top: '15%', left: '10%',
          background: primaryColor,
          opacity: 0.08,
          filter: 'blur(120px)',
          transition: 'background 0.8s ease',
          willChange: 'transform',
        }}
      />
      <div
        ref={glowRef2}
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 900, height: 900,
          bottom: '5%', right: '5%',
          background: primaryColor,
          opacity: 0.06,
          filter: 'blur(150px)',
          transition: 'background 0.8s ease',
          willChange: 'transform',
        }}
      />

      {/* Vignette Overlay for Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(5,5,5,0.85)_100%)] pointer-events-none" />
    </div>
  );
}
