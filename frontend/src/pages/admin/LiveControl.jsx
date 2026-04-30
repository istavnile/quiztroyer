import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import api from '../../lib/api';
import { UilCircle, UilCheck, UilApps, UilMapPin, UilLink, UilRocket, UilChartBar, UilPlay, UilStopCircle, UilTrophy, UilClock, UilMedal, UilDesktop, UilCopy, UilListUl } from '@iconscout/react-unicons';

const TYPE_ICONS = {
  QUIZ:      <UilCircle size={14} />,
  TRUEFALSE: <UilCheck size={14} />,
  PUZZLE:    <UilApps size={14} />,
  PINIMAGE:  <UilMapPin size={14} />,
};

export default function LiveControl() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    adminReady,
    challenge,
    playerCount,
    slideIndex,
    totalSlides,
    currentQuestion,
    answeredCount,
    phase,
    ranking,
    podium,
    connectAdminSocket,
    hostStart,
    hostNext,
    hostRanking,
    disconnectAdmin,
  } = useAdmin();

  const [challengeData, setChallengeData] = useState(null);

  useEffect(() => {
    api.get(`/admin/challenges/${id}`).then((res) => {
      setChallengeData(res.data);
      connectAdminSocket(res.data.slug);
    });
    return () => disconnectAdmin();
  }, [id]);

  const isLastSlide = slideIndex >= totalSlides - 1;

  function copyJoinLink() {
    const url = `${window.location.origin}/join/${challengeData?.slug}`;
    navigator.clipboard.writeText(url);
  }

  if (!adminReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Conectando al servidor de juego...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-white text-sm">
            ← Admin
          </button>
          <div>
            <h1 className="text-white font-bold">{challengeData?.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Control Live</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open(`${window.location.origin}/display/challenge/${challengeData?.slug}`, '_blank')}
            className="glass-btn-blue text-sm px-3 py-2 rounded-xl"
            title="Abrir pantalla de proyección"
          >
            <span className="flex items-center gap-1.5"><UilDesktop size={15} />Pantalla</span>
          </button>
          <button
            onClick={copyJoinLink}
            className="glass-btn text-slate-300 text-sm px-3 py-2 rounded-xl border border-white/[0.10]"
          >
            <span className="flex items-center gap-1.5"><UilLink size={15} />Copiar link</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid gap-4" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,clamp(0px,(100vw - 640px)*2,320px))' }}>
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Status cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-white">{playerCount}</p>
              <p className="text-slate-400 text-xs mt-1">Jugadores</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-white">
                {slideIndex >= 0 ? `${slideIndex + 1}/${totalSlides}` : '—'}
              </p>
              <p className="text-slate-400 text-xs mt-1">Slide actual</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-white">{answeredCount}</p>
              <p className="text-slate-400 text-xs mt-1">Respondieron</p>
            </div>
          </div>

          {/* Main control */}
          <div className="glass-card rounded-2xl p-6">
            <AnimatePresence mode="wait">
              {phase === 'LOBBY' && (
                <motion.div
                  key="lobby"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-4"><UilClock size={56} className="text-slate-500" /></div>
                  <h2 className="text-2xl font-bold text-white mb-2">Lobby activo</h2>
                  <p className="text-slate-400 mb-2">
                    {playerCount === 0
                      ? 'Esperando jugadores...'
                      : `${playerCount} jugador${playerCount !== 1 ? 'es' : ''} conectado${playerCount !== 1 ? 's' : ''}`}
                  </p>

                  <div className="bg-white/[0.06] border border-white/[0.10] rounded-xl p-3 mb-6 text-sm font-mono text-slate-300">
                    {window.location.origin}/join/{challengeData?.slug}
                    <span className="ml-3 text-blue-400">PIN: {challengeData?.pin}</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={hostStart}
                    disabled={totalSlides === 0}
                    className="glass-btn-green disabled:opacity-40 font-bold text-xl px-10 py-5 rounded-2xl"
                  >
                    <span className="flex items-center gap-2"><UilRocket size={22} />Iniciar Desafío</span>
                  </motion.button>

                  {totalSlides === 0 && (
                    <p className="text-red-400 text-sm mt-3">Este desafío no tiene preguntas aún</p>
                  )}
                </motion.div>
              )}

              {phase === 'PLAYING' && currentQuestion && (
                <motion.div
                  key={`play-${slideIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-slate-400">{TYPE_ICONS[currentQuestion.type]}</span>
                    <div>
                      <p className="text-slate-400 text-xs">Slide {slideIndex + 1} de {totalSlides}</p>
                      <p className="text-white font-semibold">{currentQuestion.prompt}</p>
                    </div>
                  </div>

                  {/* Answer progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Respuestas recibidas</span>
                      <span>{answeredCount} / {playerCount}</span>
                    </div>
                    <div className="bg-white/8 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: playerCount > 0 ? `${(answeredCount / playerCount) * 100}%` : '0%' }}
                        transition={{ type: 'spring' }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={hostRanking}
                      className="flex-1 glass-btn text-white font-bold py-4 rounded-xl border border-white/[0.10]"
                    >
                      <span className="flex items-center justify-center gap-1.5"><UilChartBar size={18} />Ver Ranking</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={hostNext}
                      className="flex-1 glass-btn-blue font-semibold py-4 rounded-xl text-lg"
                    >
                      {isLastSlide
                        ? <span className="flex items-center justify-center gap-1.5"><UilStopCircle size={20} />Terminar</span>
                        : <span className="flex items-center justify-center gap-1.5"><UilPlay size={20} />Siguiente</span>}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {phase === 'RANKING' && (
                <motion.div
                  key="ranking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2"><UilChartBar size={20} />Mostrando Ranking</h2>
                  <div className="space-y-2 mb-6 text-left">
                    {ranking.slice(0, 5).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2">
                        <span className="text-sm font-black text-slate-400 w-5 text-center">#{i + 1}</span>
                        <span className="flex-1 text-white text-sm font-medium">{p.playerName}</span>
                        <span className="text-blue-400 font-bold text-sm">{p.totalScore?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={hostNext}
                    className="w-full glass-btn-blue font-semibold py-4 rounded-xl text-lg"
                  >
                    {isLastSlide
                      ? <span className="flex items-center justify-center gap-2"><UilStopCircle size={20} />Finalizar Desafío</span>
                      : <span className="flex items-center justify-center gap-2"><UilPlay size={20} />Siguiente Pregunta</span>}
                  </motion.button>
                </motion.div>
              )}

              {phase === 'ENDED' && (
                <motion.div
                  key="ended"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-4"><UilTrophy size={56} className="text-yellow-400" /></div>
                  <h2 className="text-2xl font-bold text-white mb-6">Desafío Finalizado</h2>
                  <div className="space-y-2 mb-6 text-left">
                    {podium.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-center gap-3 glass-card rounded-xl px-4 py-3">
                        <span className="text-sm font-black text-slate-400 w-5 text-center">#{i + 1}</span>
                        <span className="flex-1 text-white font-bold">{p.name}</span>
                        <span className="text-blue-400 font-black">{p.score?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full glass-btn text-white font-medium py-3 rounded-xl border border-white/[0.10]"
                  >
                    ← Volver al panel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Live ranking sidebar — collapses fluidly on small screens */}
        <div className="space-y-4 overflow-hidden">
          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5"><UilMedal size={15} />Top Jugadores</h3>
            <div className="space-y-2">
              {ranking.slice(0, 10).map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 w-5 text-xs font-bold">#{i + 1}</span>
                  <span className="flex-1 text-white truncate">{p.playerName}</span>
                  <span className="text-blue-400 font-bold text-xs">{p.totalScore?.toLocaleString()}</span>
                </div>
              ))}
              {ranking.length === 0 && (
                <p className="text-slate-500 text-xs text-center py-2">Sin datos aún</p>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5"><UilListUl size={15} />Slides</h3>
            <div className="space-y-1">
              {(challengeData?.questions || []).map((q, i) => (
                <div
                  key={q.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                    i === slideIndex ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500'
                  }`}
                >
                  <span>{TYPE_ICONS[q.type]}</span>
                  <span className="flex-1 truncate">{q.prompt || 'Sin enunciado'}</span>
                  <span>{q.timeLimit}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
