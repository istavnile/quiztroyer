import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useGame } from '../../context/GameContext';

import LobbyScreen from './LobbyScreen';
import QuestionSlide from './QuestionSlide';
import RankingScreen from './RankingScreen';
import PodiumScreen from './PodiumScreen';

export default function GameRoom() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { state, connectSocket, disconnect } = useGame();

  useEffect(() => {
    const name = sessionStorage.getItem('qt_name');
    const dni = sessionStorage.getItem('qt_dni');

    if (!name || !dni) {
      navigate(`/join/${slug}`, { replace: true });
      return;
    }

    connectSocket(slug, name, dni);

    return () => {
      disconnect();
    };
  }, [slug]);

  const { phase } = state;

  // GameRoom solo gestiona el routing entre fases.
  // El fondo y branding los aplica BrandingLayout dentro de cada pantalla.
  return (
    <AnimatePresence mode="wait">
      {(phase === 'IDLE' || phase === 'JOINING' || phase === 'LOBBY') && (
        <LobbyScreen key="lobby" />
      )}
      {phase === 'PLAYING' && (
        <QuestionSlide key={`slide-${state.slideIndex}`} />
      )}
      {phase === 'RANKING' && (
        <RankingScreen key="ranking" />
      )}
      {phase === 'ENDED' && (
        <PodiumScreen key="podium" />
      )}
    </AnimatePresence>
  );
}
