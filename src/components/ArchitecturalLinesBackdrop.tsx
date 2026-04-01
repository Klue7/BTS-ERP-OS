import React from 'react';

export function ArchitecturalLinesBackdrop() {
  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none">
      <div className="absolute inset-0 bg-[#040506]" />
      <div
        className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.16]"
        style={{
          backgroundImage: 'url("/architect-lines-bg.webp")',
          filter: 'brightness(0.55) contrast(1.15) saturate(0.72)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_34%),linear-gradient(180deg,rgba(3,5,7,0.18)_0%,rgba(3,5,7,0.48)_100%)]" />
    </div>
  );
}
