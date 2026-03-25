import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import BrandingLayout from '../../components/BrandingLayout';
import QuizQuestion from '../../components/questions/QuizQuestion';
import TrueFalseQuestion from '../../components/questions/TrueFalseQuestion';
import PuzzleQuestion from '../../components/questions/PuzzleQuestion';
import PinImageQuestion from '../../components/questions/PinImageQuestion';
import CountdownTimer from '../../components/CountdownTimer';
import AnswerFeedback from '../../components/AnswerFeedback';
import { resolveSlideBackground } from '../../lib/slideThemes';

export default function QuestionSlide() {
  const { state, submitAnswer } = useGame();
  const {
    currentQuestion,
    slideIndex,
    totalSlides,
    slideStartTimestamp,
    timeRemainingMs,
    answered,
    timedOut,
    lastAnswer,
    revealConfig,
    branding,
  } = state;

  const [blocked, setBlocked] = useState(false);

  useEffect(() => { setBlocked(false); }, [slideIndex]);
  useEffect(() => { if (timedOut) setBlocked(true); }, [timedOut]);

  function handleAnswer(answer) {
    if (blocked || answered) return;
    submitAnswer(currentQuestion.id, answer);
    setBlocked(true);
  }

  if (!currentQuestion) return null;

  const primaryColor = branding?.primaryColor || '#6366f1';
  const slideBg = resolveSlideBackground(currentQuestion.config?._slideBackground);
  const slideImage = currentQuestion.config?._slideImage || '';

  return (
    <BrandingLayout branding={branding}>
      {/* Slide background overlay (overrides game bgColor for this slide) */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative" style={slideBg || {}}>

        {/* If bg is an image, add a subtle dark overlay for readability */}
        {slideBg?.backgroundImage && (
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        )}

        {/* ── Progress + Timer ── */}
        <div
          className="relative z-10 flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs font-semibold tabular-nums">
              {slideIndex + 1} / {totalSlides}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === slideIndex ? '20px' : '6px',
                    background: i <= slideIndex ? primaryColor : 'rgba(255,255,255,0.15)',
                    opacity: i < slideIndex ? 0.45 : 1,
                  }}
                />
              ))}
            </div>
          </div>
          <CountdownTimer
            timeLimit={currentQuestion.timeLimit}
            startTimestamp={slideStartTimestamp}
            initialRemaining={timeRemainingMs}
            onExpire={() => setBlocked(true)}
            accentColor={primaryColor}
          />
        </div>

        {/* ── Question area ── */}
        <div className="relative z-10 flex-1 flex flex-col overflow-auto">

          {/* Slide central image */}
          {slideImage && (
            <div className="px-4 pt-4 shrink-0">
              <motion.img
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                src={slideImage}
                referrerPolicy="no-referrer"
                alt="Imagen del slide"
                className="mx-auto rounded-xl object-contain shadow-2xl"
                style={{ maxHeight: '200px', maxWidth: '100%' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Prompt */}
          <div className="px-5 pt-4 pb-3 shrink-0">
            <motion.h2
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl font-bold text-white leading-tight text-center drop-shadow"
            >
              {currentQuestion.prompt}
            </motion.h2>
          </div>

          {/* Answer area */}
          <div className="flex-1 px-4 pb-4 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {!answered && !timedOut ? (
                <motion.div key="q" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {currentQuestion.type === 'QUIZ' && (
                    <QuizQuestion question={currentQuestion} onAnswer={handleAnswer} blocked={blocked} accentColor={primaryColor} />
                  )}
                  {currentQuestion.type === 'TRUEFALSE' && (
                    <TrueFalseQuestion question={currentQuestion} onAnswer={handleAnswer} blocked={blocked} accentColor={primaryColor} />
                  )}
                  {currentQuestion.type === 'PUZZLE' && (
                    <PuzzleQuestion question={currentQuestion} onAnswer={handleAnswer} blocked={blocked} accentColor={primaryColor} />
                  )}
                  {currentQuestion.type === 'PINIMAGE' && (
                    <PinImageQuestion question={currentQuestion} onAnswer={handleAnswer} blocked={blocked} accentColor={primaryColor} />
                  )}
                </motion.div>
              ) : (
                <motion.div key="fb" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center py-6">
                  <AnswerFeedback
                    lastAnswer={lastAnswer}
                    timedOut={timedOut && !answered}
                    revealConfig={revealConfig}
                    questionType={currentQuestion.type}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </BrandingLayout>
  );
}
