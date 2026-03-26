import React from 'react';
import BackgroundEffect from './BackgroundEffect';

/**
 * Shared background layer for all login/join screens.
 * Shows the site-wide effect (blobs or canvas effect) using the accent color.
 */
export default function PageBackground({ siteSettings, color }) {
  const effect = siteSettings?.bgEffect || 'blobs';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {effect === 'blobs' ? (
        <>
          <div
            className="blob-anim-1 absolute -top-20 -right-20 w-[280px] h-[280px] sm:w-[480px] sm:h-[480px] rounded-full blur-3xl opacity-25"
            style={{ background: color }}
          />
          <div
            className="blob-anim-2 absolute -bottom-20 -left-20 w-[280px] h-[280px] sm:w-[480px] sm:h-[480px] rounded-full blur-3xl opacity-20"
            style={{ background: color }}
          />
        </>
      ) : (
        <BackgroundEffect type={effect} color={color} />
      )}
    </div>
  );
}
