import React, { useState } from 'react';
import { motion } from 'framer-motion';

const OPTION_COLORS = [
  { bg: 'bg-red-500/20 hover:bg-red-500/40 border-red-500/50', icon: '🔴' },
  { bg: 'bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/50', icon: '🔵' },
  { bg: 'bg-yellow-500/20 hover:bg-yellow-500/40 border-yellow-500/50', icon: '🟡' },
  { bg: 'bg-green-500/20 hover:bg-green-500/40 border-green-500/50', icon: '🟢' },
];

export default function QuizQuestion({ question, onAnswer, blocked }) {
  const [selected, setSelected] = useState(null);
  const options = question.config.options || [];

  function handleSelect(option) {
    if (blocked || selected) return;
    setSelected(option.id);
    onAnswer({ optionId: option.id });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
      {options.map((opt, i) => {
        const colors = OPTION_COLORS[i % OPTION_COLORS.length];
        const isSelected = selected === opt.id;

        return (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(opt)}
            disabled={blocked}
            className={`
              border rounded-2xl p-4 text-left transition-all duration-200 min-h-20
              ${colors.bg}
              ${isSelected ? 'ring-2 ring-white scale-105' : ''}
              ${blocked && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{colors.icon}</span>
              <span className="text-white font-semibold text-base leading-snug">{opt.text}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
