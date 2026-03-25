import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function TrueFalseQuestion({ question, onAnswer, blocked }) {
  const [selected, setSelected] = useState(null);

  function handleSelect(value) {
    if (blocked || selected !== null) return;
    setSelected(value);
    onAnswer({ value });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto mt-4">
      <motion.button
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleSelect(true)}
        disabled={blocked}
        className={`
          flex-1 w-full min-h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2
          transition-all duration-200 cursor-pointer
          bg-green-500/20 border-green-500/50 hover:bg-green-500/40
          ${selected === true ? 'ring-4 ring-green-400 scale-105' : ''}
          ${blocked && selected !== true ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <span className="text-5xl">✅</span>
        <span className="text-2xl font-black text-green-400">VERDADERO</span>
      </motion.button>

      <motion.button
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleSelect(false)}
        disabled={blocked}
        className={`
          flex-1 w-full min-h-32 rounded-2xl border-2 flex flex-col items-center justify-center gap-2
          transition-all duration-200 cursor-pointer
          bg-red-500/20 border-red-500/50 hover:bg-red-500/40
          ${selected === false ? 'ring-4 ring-red-400 scale-105' : ''}
          ${blocked && selected !== false ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <span className="text-5xl">❌</span>
        <span className="text-2xl font-black text-red-400">FALSO</span>
      </motion.button>
    </div>
  );
}
