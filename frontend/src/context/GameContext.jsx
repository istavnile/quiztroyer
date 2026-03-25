import React, { createContext, useContext, useReducer, useRef } from 'react';
import { io } from 'socket.io-client';

const GameContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

const initialState = {
  socket: null,
  connected: false,
  phase: 'IDLE', // IDLE | JOINING | LOBBY | PLAYING | RANKING | ENDED
  slug: null,
  challengeName: null,
  branding: {},
  sessionId: null,
  playerName: null,
  playerDni: null,
  totalSlides: 0,
  slideIndex: -1,
  currentQuestion: null,
  slideStartTimestamp: null,
  timeRemainingMs: 0,
  lastAnswer: null, // { correct, score, timeTakenMs }
  ranking: [],
  podium: [],
  answered: false,
  timedOut: false,
  revealConfig: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'CONNECTED':
      return { ...state, connected: true };
    case 'DISCONNECTED':
      return { ...state, connected: false };
    case 'SET_SLUG':
      return { ...state, slug: action.payload };
    case 'PLAYER_JOINED':
      return {
        ...state,
        phase: action.payload.phase === 'PLAYING' ? 'PLAYING' : 'LOBBY',
        sessionId: action.payload.sessionId,
        playerName: action.payload.name,
        challengeName: action.payload.challengeName,
        branding: action.payload.branding || {},
      };
    case 'GAME_START':
      return { ...state, phase: 'PLAYING', totalSlides: action.payload.totalSlides };
    case 'SLIDE_SHOW':
      return {
        ...state,
        phase: 'PLAYING',
        currentQuestion: action.payload.question,
        slideIndex: action.payload.slideIndex,
        totalSlides: action.payload.totalSlides,
        slideStartTimestamp: action.payload.serverTimestamp,
        timeRemainingMs: action.payload.timeRemainingMs,
        answered: false,
        timedOut: false,
        lastAnswer: null,
        revealConfig: null,
      };
    case 'SLIDE_TIMEOUT':
      return { ...state, timedOut: true };
    case 'SLIDE_REVEAL':
      return { ...state, revealConfig: action.payload };
    case 'ANSWER_RESULT':
      return { ...state, answered: true, lastAnswer: action.payload };
    case 'PHASE_RANKING':
      return { ...state, phase: 'RANKING' };
    case 'RANKING_UPDATE':
      return { ...state, ranking: action.payload.ranking };
    case 'GAME_END':
      return { ...state, phase: 'ENDED', podium: action.payload.podium };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(null);

  function connectSocket(slug, playerName, playerDni) {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    dispatch({ type: 'SET_SOCKET', payload: socket });
    dispatch({ type: 'SET_SLUG', payload: slug });

    socket.on('connect', () => {
      dispatch({ type: 'CONNECTED' });
      socket.emit('player:join', { slug, name: playerName, dni: playerDni });
    });

    socket.on('disconnect', () => dispatch({ type: 'DISCONNECTED' }));

    socket.on('player:joined', (data) => {
      dispatch({ type: 'PLAYER_JOINED', payload: { ...data, name: playerName } });
    });

    socket.on('game:start', (data) => {
      dispatch({ type: 'GAME_START', payload: data });
    });

    socket.on('slide:show', (data) => {
      dispatch({ type: 'SLIDE_SHOW', payload: data });
    });

    socket.on('slide:timeout', () => {
      dispatch({ type: 'SLIDE_TIMEOUT' });
    });

    socket.on('slide:reveal', (data) => {
      dispatch({ type: 'SLIDE_REVEAL', payload: data });
    });

    socket.on('answer:result', (data) => {
      dispatch({ type: 'ANSWER_RESULT', payload: data });
    });

    socket.on('phase:ranking', () => {
      dispatch({ type: 'PHASE_RANKING' });
    });

    socket.on('ranking:update', (data) => {
      dispatch({ type: 'RANKING_UPDATE', payload: data });
    });

    socket.on('game:end', (data) => {
      dispatch({ type: 'GAME_END', payload: data });
    });

    socket.on('error', (err) => {
      console.error('[Socket error]', err);
    });
  }

  function submitAnswer(questionId, answer) {
    if (socketRef.current && !state.answered && !state.timedOut) {
      socketRef.current.emit('answer:submit', { questionId, answer });
    }
  }

  function disconnect() {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    dispatch({ type: 'RESET' });
  }

  return (
    <GameContext.Provider value={{ state, connectSocket, submitAnswer, disconnect }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
