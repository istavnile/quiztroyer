import React, { useState } from 'react';

/**
 * BrandingLayout — wrapper de todas las pantallas del juego.
 *
 * Branding shape:
 * {
 *   bgColor:       string  — color de fondo del juego
 *   primaryColor:  string  — color del banner cuando es modo texto
 *   headerText:    string  — texto del banner superior (modo texto)
 *   headerImage:   string  — URL imagen banner superior (tiene prioridad sobre texto)
 *   headerHeight:  number  — altura en px del banner superior (default 80)
 *   footerText:    string  — texto del banner inferior (modo texto)
 *   footerImage:   string  — URL imagen banner inferior (tiene prioridad sobre texto)
 *   footerHeight:  number  — altura en px del banner inferior (default 56)
 *   logoUrl:       string  — logo mostrado en el banner de texto
 * }
 *
 * Resolución recomendada para imágenes de banner:
 *   • Header: 1920 × 160 px  (ratio 12:1)
 *   • Footer: 1920 × 100 px  (ratio ~19:1)
 *   Formatos: PNG / JPG / WebP  |  Peso máx: 500 KB
 */
export default function BrandingLayout({ branding = {}, children }) {
  const {
    bgColor           = '#0f172a',
    primaryColor      = '#6366f1',
    headerText        = '',
    headerImage       = '',
    headerHeight      = 80,
    headerImagePosX   = 50,
    headerImagePosY   = 50,
    footerText        = '',
    footerImage       = '',
    footerHeight      = 56,
    footerImagePosX   = 50,
    footerImagePosY   = 50,
    footerColor,
    logoUrl           = '',
    logoPosition      = 'left',
  } = branding;

  const resolvedFooterColor = footerColor || primaryColor;

  const showHeader = headerImage || headerText || logoUrl;
  const showFooter = footerImage || footerText;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgColor }}>

      {/* ── BANNER SUPERIOR ── */}
      {showHeader && (
        <BrandingBanner
          image={headerImage}
          text={headerText}
          logoUrl={logoUrl}
          logoPosition={logoPosition}
          height={headerHeight}
          primaryColor={primaryColor}
          position="header"
          posX={headerImagePosX}
          posY={headerImagePosY}
        />
      )}

      {/* ── CONTENIDO ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {children}
      </div>

      {/* ── BANNER INFERIOR ── */}
      {showFooter && (
        <BrandingBanner
          image={footerImage}
          text={footerText}
          height={footerHeight}
          primaryColor={resolvedFooterColor}
          position="footer"
          posX={footerImagePosX}
          posY={footerImagePosY}
        />
      )}
    </div>
  );
}

/* ─── Banner individual ─── */
function BrandingBanner({ image, text, logoUrl, logoPosition = 'left', height, primaryColor, position, posX = 50, posY = 50 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const style = { height: `${height}px`, minHeight: `${height}px` };

  /* Modo imagen */
  if (image && !imgFailed) {
    return (
      <div className="w-full shrink-0 overflow-hidden" style={style}>
        <img
          src={image}
          alt={position === 'header' ? 'Banner superior' : 'Banner inferior'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none"
          style={{ objectPosition: `${posX}% ${posY}%` }}
          draggable={false}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  /* Modo texto */
  return (
    <div
      className="w-full shrink-0 flex items-center px-5 overflow-hidden"
      style={{ ...style, background: primaryColor }}
    >
      <div className="flex items-center gap-3 w-full">
        {logoUrl && position === 'header' && logoPosition !== 'right' && (
          <img
            src={logoUrl}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="object-contain max-w-[120px] select-none shrink-0"
            style={{ height: `${Math.min(height * 0.65, 48)}px` }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        {text && (
          <span
            className="font-black text-white tracking-wide uppercase truncate"
            style={{ fontSize: `${Math.max(Math.min(height * 0.3, 22), 12)}px` }}
          >
            {text}
          </span>
        )}
        {logoUrl && position === 'header' && logoPosition === 'right' && (
          <img
            src={logoUrl}
            alt="Logo"
            referrerPolicy="no-referrer"
            className="object-contain max-w-[120px] select-none shrink-0 ml-auto"
            style={{ height: `${Math.min(height * 0.65, 48)}px` }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </div>
    </div>
  );
}
