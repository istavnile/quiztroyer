import React from 'react';
import { motion } from 'framer-motion';

export default function AnswerFeedback({ lastAnswer, timedOut, revealConfig, questionType }) {
  if (timedOut && !lastAnswer) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center w-full"
      >
        <div className="inline-block bg-black/60 backdrop-blur-md rounded-3xl px-10 py-8 max-w-sm w-full">
          <div className="text-7xl mb-4">⏰</div>
          <h2 className="text-2xl font-black text-white mb-2">¡Tiempo agotado!</h2>
          <p className="text-white/60">No respondiste a tiempo</p>
          {revealConfig && <RevealAnswer config={revealConfig} type={questionType} />}
        </div>
      </motion.div>
    );
  }

  if (!lastAnswer) return null;

  const { correct, score } = lastAnswer;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center w-full"
    >
      {/* Dark backdrop ensures text is always readable regardless of slide background */}
      <div className="inline-block bg-black/60 backdrop-blur-md rounded-3xl px-10 py-8 max-w-sm w-full">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="text-8xl mb-4"
        >
          {correct ? '🎉' : '😢'}
        </motion.div>

        <h2 className={`text-3xl font-black mb-2 ${correct ? 'text-green-400' : 'text-red-400'}`}>
          {correct ? '¡Correcto!' : 'Incorrecto'}
        </h2>

        {correct && score > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-block bg-green-500/20 border border-green-500/40 rounded-2xl px-6 py-3 mb-4"
          >
            <span className="text-3xl font-black text-green-400">+{score.toLocaleString()}</span>
            <span className="text-green-300 ml-2 text-sm">puntos</span>
          </motion.div>
        )}

        <p className="text-white/60 text-sm mt-2">
          {correct ? 'Esperando la siguiente pregunta...' : 'Más suerte la próxima vez'}
        </p>

        {revealConfig && <RevealAnswer config={revealConfig} type={questionType} />}
      </div>
    </motion.div>
  );
}

function RevealAnswer({ config, type }) {
  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-6 glass rounded-xl p-4 text-sm text-left max-w-md mx-auto"
    >
      <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Respuesta correcta</p>
      {type === 'QUIZ' && (
        <p className="text-white font-semibold">
          {config.options?.find((o) => o.isCorrect)?.text || '—'}
        </p>
      )}
      {type === 'TRUEFALSE' && (
        <p className="text-white font-semibold">
          {config.correctAnswer ? '✅ Verdadero' : '❌ Falso'}
        </p>
      )}
      {type === 'PUZZLE' && (
        <ol className="list-decimal list-inside space-y-1">
          {config.items?.map((item, i) => (
            <li key={i} className="text-white">{item}</li>
          ))}
        </ol>
      )}
      {type === 'PINIMAGE' && (
        <p className="text-white">📍 Zona marcada en el mapa</p>
      )}
    </motion.div>
  );
}
