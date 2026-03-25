import React, { createContext, useContext, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const AdminContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function AdminProvider({ children }) {
  const [adminSocket, setAdminSocket] = useState(null);
  const [adminReady, setAdminReady] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [slideIndex, setSlideIndex] = useState(-1);
  const [totalSlides, setTotalSlides] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [phase, setPhase] = useState('LOBBY');
  const [ranking, setRanking] = useState([]);
  const [podium, setPodium] = useState([]);
  const socketRef = useRef(null);

  function connectAdminSocket(slug) {
    const token = localStorage.getItem('qt_admin_token');
    if (!token) return;

    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    setAdminSocket(socket);

    socket.on('connect', () => {
      socket.emit('admin:join', { slug, token });
    });

    socket.on('admin:ready', (data) => {
      setChallenge(data.challenge);
      setPlayerCount(data.playerCount || 0);
      setSlideIndex(data.slideIndex);
      setTotalSlides(data.challenge.questions?.length || 0);
      setPhase(data.phase || 'LOBBY');
      setAdminReady(true);
    });

    socket.on('room:players', ({ count }) => setPlayerCount(count));

    socket.on('admin:slide', (data) => {
      setCurrentQuestion(data.question);
      setSlideIndex(data.slideIndex);
      setTotalSlides(data.totalSlides);
      setAnsweredCount(0);
      setPhase('PLAYING');
    });

    socket.on('slide:answered', ({ count }) => setAnsweredCount(count));

    socket.on('slide:timeout', () => {});

    socket.on('ranking:update', ({ ranking }) => setRanking(ranking));

    socket.on('game:end', ({ podium }) => {
      setPodium(podium);
      setPhase('ENDED');
    });

    socket.on('error', (err) => console.error('[AdminSocket]', err));
  }

  function hostStart() {
    socketRef.current?.emit('host:start');
    setPhase('PLAYING');
  }

  function hostNext() {
    socketRef.current?.emit('host:next');
    setAnsweredCount(0);
  }

  function hostRanking() {
    socketRef.current?.emit('host:ranking');
    setPhase('RANKING');
  }

  function disconnectAdmin() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setAdminSocket(null);
    setAdminReady(false);
  }

  return (
    <AdminContext.Provider
      value={{
        adminSocket,
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
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be inside AdminProvider');
  return ctx;
}
