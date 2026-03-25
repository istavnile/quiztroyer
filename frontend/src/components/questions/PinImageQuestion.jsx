import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PinImageQuestion({ question, onAnswer, blocked, accentColor }) {
  const imageRef = useRef(null);
  const [pin, setPin] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [imgError, setImgError] = useState(false);

  function handleImageClick(e) {
    if (blocked || submitted) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPin({ x, y });
  }

  function handleSubmit() {
    if (!pin || blocked || submitted) return;
    setSubmitted(true);
    onAnswer({ x: pin.x, y: pin.y });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-slate-400 text-sm text-center mb-3">
        {submitted ? '📍 Pin colocado — esperando resultado...' : 'Toca o haz clic en la imagen para colocar tu pin'}
      </p>

      <div className="relative rounded-xl overflow-hidden border border-slate-700 mb-4 cursor-crosshair">
        {imgError ? (
          <div className="flex flex-col items-center justify-center h-48 bg-slate-800 text-slate-500 gap-2">
            <span className="text-3xl">🖼️</span>
            <p className="text-sm">No se pudo cargar la imagen</p>
            <a
              href={question.config.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Abrir en nueva pestaña
            </a>
          </div>
        ) : (
          <img
            ref={imageRef}
            src={question.config.imageUrl}
            alt="Imagen de la pregunta"
            referrerPolicy="no-referrer"
            className="w-full object-contain select-none"
            draggable={false}
            onClick={handleImageClick}
            onError={() => setImgError(true)}
            style={{ pointerEvents: blocked || submitted ? 'none' : 'auto' }}
          />
        )}

        {/* Pin marker */}
        <AnimatePresence>
          {pin && (
            <motion.div
              key="pin"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: 'absolute',
                left: `${pin.x}%`,
                top: `${pin.y}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="text-3xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                📍
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instruction overlay when no pin */}
        {!imgError && !pin && !blocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="glass rounded-xl px-4 py-2 text-white text-sm font-medium">
              👆 Toca para marcar
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {pin && !submitted && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPin(null)}
            className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-all"
          >
            Borrar pin
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={!pin || blocked || submitted}
          className="flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: !pin || blocked || submitted ? '#334155' : accentColor || '#6366f1' }}
        >
          {submitted ? '✓ Pin enviado' : 'Confirmar pin'}
        </motion.button>
      </div>
    </div>
  );
}
