import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function CountdownTimer({ timeLimit, startTimestamp, initialRemaining, onExpire, accentColor }) {
  const [remaining, setRemaining] = useState(Math.round((initialRemaining ?? timeLimit * 1000) / 1000));
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setExpired(false);
    setRemaining(Math.round((initialRemaining ?? timeLimit * 1000) / 1000));

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      const rem = Math.max(0, timeLimit * 1000 - elapsed);
      const seconds = Math.ceil(rem / 1000);
      setRemaining(seconds);

      if (rem <= 0 && !expired) {
        clearInterval(intervalRef.current);
        setExpired(true);
        onExpire?.();
      }
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [startTimestamp, timeLimit]);

  const percent = Math.max(0, remaining / timeLimit);
  const isWarning = remaining <= Math.floor(timeLimit * 0.3);
  const isDanger = remaining <= 5;

  const color = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : (accentColor || '#6366f1');
  const circumference = 2 * Math.PI * 20;
  const dashOffset = circumference * (1 - percent);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={remaining}
            initial={{ scale: isDanger ? 1.3 : 1 }}
            animate={{ scale: 1 }}
            className={`text-sm font-black ${isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'}`}
          >
            {remaining}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
