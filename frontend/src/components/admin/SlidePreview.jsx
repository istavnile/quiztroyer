import React, { useRef, useEffect, useState, memo } from 'react';
import { resolveSlideBackground } from '../../lib/slideThemes';

const OPTION_COLORS = [
  { bg: 'rgba(239,68,68,0.25)',  border: 'rgba(239,68,68,0.5)'  },
  { bg: 'rgba(59,130,246,0.25)', border: 'rgba(59,130,246,0.5)' },
  { bg: 'rgba(234,179,8,0.25)',  border: 'rgba(234,179,8,0.5)'  },
  { bg: 'rgba(34,197,94,0.25)',  border: 'rgba(34,197,94,0.5)'  },
];

/**
 * SlidePreview — miniatura escalada del slide que ve el jugador.
 * Renderiza internamente a 375×600px y escala al ancho del contenedor.
 *
 * Props:
 *   question  — el form state del QuestionForm (con .type, .prompt, .config,
 *               .slideImage, .slideBackground, .timeLimit)
 *   branding  — objeto de branding del challenge
 */
const SlidePreview = memo(function SlidePreview({ question, branding = {}, compact = false, maxScale }) {
  const outerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const INNER_W = 375;
  const INNER_H = compact ? 320 : 480;

  useEffect(() => {
    if (!outerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const computed = w / INNER_W;
      setScale(maxScale != null ? Math.min(computed, maxScale) : computed);
    });
    ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, [maxScale]);

  if (!question) return null;

  const {
    bgColor      = '#0f172a',
    primaryColor = '#6366f1',
    headerText   = '',
    headerImage  = '',
    headerHeight = 80,
    footerText   = '',
    footerImage  = '',
    footerHeight = 56,
    logoUrl      = '',
    logoPosition = 'left',
  } = branding;

  const slideBg    = resolveSlideBackground(question.slideBackground);
  const slideImage = question.slideImage || '';
  const opts       = question.config?.options || [];
  const items      = question.config?.items   || [];

  const showHeader = headerImage || headerText || logoUrl;
  const showFooter = footerImage || footerText;

  // Scale header/footer heights proportionally
  const scaledHH = Math.round(headerHeight * 0.6);
  const scaledFH = Math.round(footerHeight * 0.6);

  const clampedW = INNER_W * scale;

  return (
    <div ref={outerRef} className="w-full">
      {/* Outer clip — height adjusts to scaled inner; centered when maxScale caps width */}
      <div
        className="relative overflow-hidden rounded-xl border border-slate-700 shadow-2xl mx-auto"
        style={{ height: `${INNER_H * scale}px`, width: `${clampedW}px` }}
      >
        {/* Inner — full-size then scaled */}
        <div
          style={{
            width:  INNER_W,
            height: INNER_H,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* ── Whole slide wrapper ── */}
          <div
            className="flex flex-col"
            style={{ width: INNER_W, height: INNER_H, background: bgColor }}
          >
            {/* Header banner */}
            {showHeader && (
              <Banner
                image={headerImage}
                text={headerText}
                logoUrl={logoUrl}
                logoPosition={logoPosition}
                height={scaledHH}
                primaryColor={primaryColor}
                pos="header"
              />
            )}

            {/* Slide content area */}
            <div
              className="flex-1 flex flex-col overflow-hidden"
              style={slideBg ? {
                ...slideBg,
                position: 'relative',
              } : {}}
            >
              {/* Dark overlay for image bgs */}
              {slideBg?.backgroundImage && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 0 }} />
              )}

              {/* Progress bar strip */}
              <div
                className="flex items-center justify-between px-3 py-2 shrink-0"
                style={{ background: 'rgba(0,0,0,0.3)', position: 'relative', zIndex: 1 }}
              >
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>1 / 1</span>
                  <div style={{ width: 20, height: 4, borderRadius: 2, background: primaryColor }} />
                </div>
                {/* Timer circle */}
                <div style={{ width: 28, height: 28, position: 'relative' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                    <circle cx="14" cy="14" r="11" fill="none" stroke={primaryColor} strokeWidth="2.5"
                      strokeDasharray={69} strokeDashoffset={20} strokeLinecap="round" />
                  </svg>
                  <span style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', fontSize: 8, fontWeight: 700,
                  }}>
                    {question.timeLimit || 30}
                  </span>
                </div>
              </div>

              {/* Slide image */}
              {slideImage && (
                <div style={{ padding: '8px 12px 0', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                  <img
                    src={slideImage}
                    referrerPolicy="no-referrer"
                    alt=""
                    style={{ width: '100%', maxHeight: 110, objectFit: 'contain', borderRadius: 8 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Prompt */}
              <div style={{ padding: '10px 14px 6px', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                <p style={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: question.prompt?.length > 80 ? 13 : 15,
                  lineHeight: 1.35,
                  textAlign: 'center',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}>
                  {question.prompt || <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontStyle: 'italic' }}>Sin enunciado</span>}
                </p>
              </div>

              {/* Answer area */}
              <div style={{ flex: 1, padding: '4px 12px 8px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <AnswerPreview type={question.type} opts={opts} items={items} primaryColor={primaryColor} config={question.config} />
              </div>
            </div>

            {/* Footer banner */}
            {showFooter && (
              <Banner
                image={footerImage}
                text={footerText}
                height={scaledFH}
                primaryColor={primaryColor}
                pos="footer"
              />
            )}
          </div>
        </div>

        {/* "PREVIEW" watermark */}
        <div style={{
          position: 'absolute', top: 6, right: 8, zIndex: 99,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          borderRadius: 4, padding: '1px 5px',
          color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
          pointerEvents: 'none',
        }}>
          PREVIEW
        </div>
      </div>
    </div>
  );
});

export default SlidePreview;

/* ── Banner mini ── */
function Banner({ image, text, logoUrl, logoPosition = 'left', height, primaryColor, pos }) {
  if (image?.trim()) {
    return (
      <div style={{ height, width: '100%', overflow: 'hidden', flexShrink: 0 }}>
        <img src={image} referrerPolicy="no-referrer" alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.parentElement.style.background = primaryColor; e.currentTarget.style.display = 'none'; }} />
      </div>
    );
  }
  const logoImg = logoUrl && pos === 'header' && (
    <img src={logoUrl} referrerPolicy="no-referrer" alt=""
      style={{ height: height * 0.6, maxWidth: 60, objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
  );
  return (
    <div style={{ height, background: primaryColor, display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0, gap: 6 }}>
      {logoPosition !== 'right' && logoImg}
      {text && (
        <span style={{ color: 'white', fontWeight: 900, fontSize: Math.max(height * 0.28, 9), textTransform: 'uppercase', letterSpacing: '0.04em', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
          {text}
        </span>
      )}
      {logoPosition === 'right' && <span style={{ flex: 1 }} />}
      {logoPosition === 'right' && logoImg}
    </div>
  );
}

/* ── Answer preview per type ── */
function AnswerPreview({ type, opts, items, primaryColor, config }) {
  if (type === 'QUIZ') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: opts.length <= 2 ? '1fr' : '1fr 1fr', gap: 5 }}>
        {opts.map((opt, i) => {
          const c = OPTION_COLORS[i % OPTION_COLORS.length];
          return (
            <div key={opt.id || i} style={{
              background: c.bg, border: `1.5px solid ${c.border}`,
              borderRadius: 10, padding: '6px 8px', minHeight: 32,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ fontSize: 11 }}>{'🔴🔵🟡🟢'[i]}</span>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {opt.text || `Opción ${i + 1}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'TRUEFALSE') {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: 'rgba(34,197,94,0.2)', border: '1.5px solid rgba(34,197,94,0.5)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 20 }}>✅</div>
          <div style={{ color: '#4ade80', fontWeight: 800, fontSize: 11, marginTop: 3 }}>VERDADERO</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(239,68,68,0.2)', border: '1.5px solid rgba(239,68,68,0.5)', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 20 }}>❌</div>
          <div style={{ color: '#f87171', fontWeight: 800, fontSize: 11, marginTop: 3 }}>FALSO</div>
        </div>
      </div>
    );
  }

  if (type === 'PUZZLE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.slice(0, 4).map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}>☰</span>
            <span style={{ color: 'white', fontSize: 11 }}>{item || `Ítem ${i + 1}`}</span>
          </div>
        ))}
        {items.length > 4 && (
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center' }}>+{items.length - 4} más</span>
        )}
      </div>
    );
  }

  if (type === 'PINIMAGE') {
    const imgUrl = config?.imageUrl || '';
    return (
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', background: '#1e293b' }}>
        {imgUrl ? (
          <img src={imgUrl} referrerPolicy="no-referrer" alt=""
            style={{ width: '100%', maxHeight: 100, objectFit: 'contain', display: 'block' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
            Sin imagen
          </div>
        )}
        {/* Fake crosshair */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ fontSize: 18, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}>📍</span>
        </div>
      </div>
    );
  }

  return null;
}
