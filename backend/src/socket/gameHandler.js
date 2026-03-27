const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// In-memory state per room (challengeId -> roomState)
const rooms = new Map();

function getRoomId(slug) {
  return `room:${slug}`;
}

function getRoom(slug) {
  if (!rooms.has(slug)) {
    rooms.set(slug, {
      slug,
      players: new Map(), // socketId -> { name, dni, sessionId }
      questions: null,    // cached after game start
      slideIndex: -1,
      slideStartedAt: null,
      phase: 'LOBBY', // LOBBY | PLAYING | RANKING | ENDED
      adminSocket: null,
      answeredThisSlide: new Set(), // sessionIds that answered current slide
    });
  }
  return rooms.get(slug);
}

// Score calculation (server-side only)
function calculateScore(correct, timeLimitMs, timeTakenMs) {
  if (!correct) return 0;
  const remaining = Math.max(0, timeLimitMs - timeTakenMs);
  return Math.round(1000 + (remaining / timeLimitMs) * 500);
}

// Check answer correctness
function checkAnswer(question, playerAnswer) {
  const { type, config } = question;
  switch (type) {
    case 'QUIZ': {
      const correct = config.options.find((o) => o.isCorrect);
      return playerAnswer.optionId === correct?.id;
    }
    case 'TRUEFALSE': {
      return playerAnswer.value === config.correctAnswer;
    }
    case 'PUZZLE': {
      const correctOrder = config.items;
      const submitted = playerAnswer.order;
      if (!Array.isArray(submitted) || submitted.length !== correctOrder.length) return false;
      return submitted.every((item, i) => item === correctOrder[i]);
    }
    case 'PINIMAGE': {
      const { correctX, correctY, radius } = config;
      const dx = playerAnswer.x - correctX;
      const dy = playerAnswer.y - correctY;
      return Math.sqrt(dx * dx + dy * dy) <= radius;
    }
    default:
      return false;
  }
}

// Strip correct answer info before sending slide to players
function sanitizeQuestionForPlayer(question) {
  const { config, type } = question;
  let safeConfig = {};

  switch (type) {
    case 'QUIZ':
      safeConfig = { options: config.options.map(({ id, text }) => ({ id, text })) };
      break;
    case 'TRUEFALSE':
      safeConfig = {};
      break;
    case 'PUZZLE':
      safeConfig = { items: [...config.items].sort(() => Math.random() - 0.5) };
      break;
    case 'PINIMAGE':
      safeConfig = { imageUrl: config.imageUrl };
      break;
  }

  return {
    id: question.id,
    type,
    prompt: question.prompt,
    timeLimit: question.timeLimit,
    config: {
      ...safeConfig,
      // Pass slide image and background (safe — no answers revealed)
      _slideImage:      config._slideImage      || null,
      _slideBackground: config._slideBackground || null,
    },
    order: question.order,
  };
}

async function getPlayerCount(slug, io) {
  const room = getRoomId(slug);
  const sockets = await io.in(room).fetchSockets();
  const r = getRoom(slug);
  // Count non-admin sockets
  return [...r.players.values()].length;
}

async function broadcastRanking(slug, io, challengeId) {
  const sessions = await prisma.gameSession.findMany({
    where: { challengeId },
    orderBy: { totalScore: 'desc' },
    take: 10,
    select: { id: true, playerName: true, totalScore: true },
  });
  io.to(getRoomId(slug)).emit('ranking:update', { ranking: sessions });
}

function setupGameSocket(io) {
  io.on('connection', (socket) => {
    // ─────────────────────────────────────────────
    // ADMIN: join as host
    // ─────────────────────────────────────────────
    socket.on('admin:join', async ({ slug, token }) => {
      // Simple token verification (JWT check via inline decode)
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      } catch {
        socket.emit('error', { message: 'Admin no autorizado' });
        return;
      }

      const challenge = await prisma.challenge.findUnique({
        where: { slug },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
      if (!challenge) {
        socket.emit('error', { message: 'Desafío no encontrado' });
        return;
      }

      const room = getRoom(slug);
      room.adminSocket = socket.id;
      socket.join(getRoomId(slug));
      socket.data = { role: 'admin', slug, challengeId: challenge.id };

      socket.emit('admin:ready', {
        challenge,
        playerCount: room.players.size,
        phase: room.phase,
        slideIndex: room.slideIndex,
      });

      // Update DB status to LIVE
      await prisma.challenge.update({ where: { id: challenge.id }, data: { status: 'LIVE' } });
      await prisma.liveRoom.upsert({
        where: { challengeId: challenge.id },
        create: { challengeId: challenge.id, phase: 'LOBBY', currentSlide: -1 },
        update: { phase: 'LOBBY', currentSlide: -1 },
      });

      console.log(`[Admin] joined room ${slug}`);
    });

    // ─────────────────────────────────────────────
    // DISPLAY: join as projection screen (no auth)
    // ─────────────────────────────────────────────
    socket.on('display:join', async ({ slug }) => {
      const challenge = await prisma.challenge.findUnique({
        where: { slug },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
      if (!challenge) return socket.emit('error', { message: 'Desafío no encontrado' });

      const room = getRoom(slug);
      socket.join(getRoomId(slug));
      socket.data = { role: 'display', slug };

      let currentQuestion = null;
      let timeRemainingMs = null;
      if (room.phase === 'PLAYING' && room.slideIndex >= 0) {
        const qs = room.questions?.length ? room.questions : challenge.questions;
        const q = qs[room.slideIndex];
        if (q) {
          currentQuestion = sanitizeQuestionForPlayer(q);
          timeRemainingMs = Math.max(0, (q.timeLimit * 1000) - (Date.now() - (room.slideStartedAt || 0)));
        }
      }

      socket.emit('display:ready', {
        challenge: { name: challenge.name, slug: challenge.slug, branding: challenge.branding },
        phase: room.phase,
        slideIndex: room.slideIndex,
        totalSlides: challenge.questions.length,
        playerCount: room.players.size,
        currentQuestion,
        timeRemainingMs,
        serverTimestamp: room.slideStartedAt,
      });
    });

    // ─────────────────────────────────────────────
    // PLAYER: join lobby
    // ─────────────────────────────────────────────
    socket.on('player:join', async ({ slug, name, dni }) => {
      const challenge = await prisma.challenge.findUnique({ where: { slug } });
      if (!challenge) {
        socket.emit('error', { message: 'Desafío no encontrado' });
        return;
      }
      if (challenge.status === 'ENDED') {
        socket.emit('error', { message: 'Este desafío ya terminó' });
        return;
      }

      // Upsert session
      let session;
      try {
        session = await prisma.gameSession.upsert({
          where: { challengeId_playerDni: { challengeId: challenge.id, playerDni: dni } },
          create: { challengeId: challenge.id, playerName: name, playerDni: dni, socketId: socket.id },
          update: { socketId: socket.id, playerName: name },
        });
      } catch (e) {
        socket.emit('error', { message: 'Error al registrar jugador' });
        return;
      }

      const room = getRoom(slug);
      room.players.set(socket.id, { name, dni, sessionId: session.id });
      socket.join(getRoomId(slug));
      socket.data = { role: 'player', slug, challengeId: challenge.id, sessionId: session.id, name, dni };

      const playerCount = room.players.size;

      socket.emit('player:joined', {
        sessionId: session.id,
        name,
        phase: room.phase,
        slideIndex: room.slideIndex,
        branding: challenge.branding,
        challengeName: challenge.name,
      });

      // Notify admin of new player count
      if (room.adminSocket) {
        io.to(room.adminSocket).emit('room:players', { count: playerCount });
      }

      // If game already in progress, send current slide
      if (room.phase === 'PLAYING' && room.slideIndex >= 0) {
        const questions = room.questions || await prisma.question.findMany({
          where: { challengeId: challenge.id },
          orderBy: { order: 'asc' },
        });
        const q = questions[room.slideIndex];
        if (q) {
          const elapsed = Date.now() - room.slideStartedAt;
          const remaining = Math.max(0, q.timeLimit * 1000 - elapsed);
          socket.emit('slide:show', {
            question: sanitizeQuestionForPlayer(q),
            serverTimestamp: room.slideStartedAt,
            timeRemainingMs: remaining,
            slideIndex: room.slideIndex,
            totalSlides: questions.length,
          });
        }
      }

      console.log(`[Player] ${name} (${dni}) joined ${slug}. Players: ${playerCount}`);
    });

    // ─────────────────────────────────────────────
    // ADMIN: start challenge
    // ─────────────────────────────────────────────
    socket.on('host:start', async () => {
      const { slug, challengeId, role } = socket.data || {};
      if (role !== 'admin') return;

      const room = getRoom(slug);
      const questions = await prisma.question.findMany({
        where: { challengeId },
        orderBy: { order: 'asc' },
      });

      if (questions.length === 0) {
        socket.emit('error', { message: 'No hay preguntas en este desafío' });
        return;
      }

      room.questions = questions;
      room.phase = 'PLAYING';
      room.slideIndex = 0;
      room.slideStartedAt = Date.now();
      room.answeredThisSlide = new Set();

      const q = questions[0];

      io.to(getRoomId(slug)).emit('game:start', {
        totalSlides: questions.length,
      });

      io.to(getRoomId(slug)).emit('slide:show', {
        question: sanitizeQuestionForPlayer(q),
        serverTimestamp: room.slideStartedAt,
        timeRemainingMs: q.timeLimit * 1000,
        slideIndex: 0,
        totalSlides: questions.length,
      });

      socket.emit('admin:slide', {
        question: q,
        slideIndex: 0,
        totalSlides: questions.length,
        serverTimestamp: room.slideStartedAt,
      });

      await prisma.liveRoom.update({
        where: { challengeId },
        data: { phase: 'PLAYING', currentSlide: 0, slideStartedAt: new Date(room.slideStartedAt) },
      });

      // Auto-timeout slide
      scheduleTimeout(io, slug, challengeId, 0, q.timeLimit, questions);

      console.log(`[Host] Started challenge ${slug}, slide 0`);
    });

    // ─────────────────────────────────────────────
    // ADMIN: next slide
    // ─────────────────────────────────────────────
    socket.on('host:next', async () => {
      const { slug, challengeId, role } = socket.data || {};
      if (role !== 'admin') return;

      const room = getRoom(slug);
      const questions = room.questions || await prisma.question.findMany({
        where: { challengeId },
        orderBy: { order: 'asc' },
      });

      // Clear any pending timeout for the current slide before advancing
      const prevKey = `${slug}:${room.slideIndex}`;
      if (slideTimeouts.has(prevKey)) {
        clearTimeout(slideTimeouts.get(prevKey));
        slideTimeouts.delete(prevKey);
      }

      const nextIndex = room.slideIndex + 1;
      if (nextIndex >= questions.length) {
        // Game over
        await endGame(io, slug, challengeId, questions.length);
        return;
      }

      room.slideIndex = nextIndex;
      room.slideStartedAt = Date.now();
      room.answeredThisSlide = new Set();
      room.phase = 'PLAYING';

      const q = questions[nextIndex];

      io.to(getRoomId(slug)).emit('slide:show', {
        question: sanitizeQuestionForPlayer(q),
        serverTimestamp: room.slideStartedAt,
        timeRemainingMs: q.timeLimit * 1000,
        slideIndex: nextIndex,
        totalSlides: questions.length,
      });

      socket.emit('admin:slide', {
        question: q,
        slideIndex: nextIndex,
        totalSlides: questions.length,
        serverTimestamp: room.slideStartedAt,
      });

      await prisma.liveRoom.update({
        where: { challengeId },
        data: { currentSlide: nextIndex, slideStartedAt: new Date(room.slideStartedAt), phase: 'PLAYING' },
      });

      scheduleTimeout(io, slug, challengeId, nextIndex, q.timeLimit, questions);

      console.log(`[Host] Advanced to slide ${nextIndex} in ${slug}`);
    });

    // ─────────────────────────────────────────────
    // ADMIN: show ranking
    // ─────────────────────────────────────────────
    socket.on('host:ranking', async () => {
      const { slug, challengeId, role } = socket.data || {};
      if (role !== 'admin') return;

      const room = getRoom(slug);
      room.phase = 'RANKING';

      await broadcastRanking(slug, io, challengeId);
      io.to(getRoomId(slug)).emit('phase:ranking');
    });

    // ─────────────────────────────────────────────
    // PLAYER: submit answer
    // ─────────────────────────────────────────────
    socket.on('answer:submit', async ({ questionId, answer }) => {
      const { slug, challengeId, sessionId, role } = socket.data || {};
      if (role !== 'player' || !sessionId) return;

      const room = getRoom(slug);
      if (room.phase !== 'PLAYING') return;

      // Prevent double-answering
      if (room.answeredThisSlide.has(sessionId)) return;

      const question = await prisma.question.findUnique({ where: { id: questionId } });
      if (!question || question.order !== room.slideIndex) return;

      // Server-side timing
      const receivedAt = Date.now();
      const timeTakenMs = receivedAt - (room.slideStartedAt || receivedAt);
      const timeLimitMs = question.timeLimit * 1000;

      // Block if time expired (add 500ms grace)
      if (timeTakenMs > timeLimitMs + 500) {
        socket.emit('answer:result', { correct: false, score: 0, tooLate: true });
        return;
      }

      const correct = checkAnswer(question, answer);
      const score = calculateScore(correct, timeLimitMs, timeTakenMs);

      room.answeredThisSlide.add(sessionId);

      // Persist answer
      try {
        await prisma.answer.upsert({
          where: { sessionId_questionId: { sessionId, questionId } },
          create: { sessionId, questionId, answer, correct, score, timeTakenMs },
          update: { answer, correct, score, timeTakenMs },
        });

        // Update total score
        if (score > 0) {
          await prisma.gameSession.update({
            where: { id: sessionId },
            data: { totalScore: { increment: score } },
          });
        }
      } catch (e) {
        console.error('Error saving answer:', e.message);
      }

      socket.emit('answer:result', { correct, score, timeTakenMs });

      // Notify admin of answer count
      if (room.adminSocket) {
        io.to(room.adminSocket).emit('slide:answered', {
          count: room.answeredThisSlide.size,
          total: room.players.size,
        });
      }

      console.log(`[Answer] ${sessionId} - Q:${questionId} correct:${correct} score:${score}`);
    });

    // ─────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      const { slug, role } = socket.data || {};
      if (!slug) return;

      const room = getRoom(slug);
      if (role === 'player') {
        room.players.delete(socket.id);
        if (room.adminSocket) {
          io.to(room.adminSocket).emit('room:players', { count: room.players.size });
        }
        console.log(`[Player] disconnected from ${slug}. Players: ${room.players.size}`);
      } else if (role === 'admin') {
        room.adminSocket = null;
      }
    });
  });
}

// Scheduled timeouts per slide
const slideTimeouts = new Map();

function scheduleTimeout(io, slug, challengeId, slideIndex, timeLimitSec, questions) {
  const key = `${slug}:${slideIndex}`;
  if (slideTimeouts.has(key)) clearTimeout(slideTimeouts.get(key));

  const t = setTimeout(async () => {
    const room = getRoom(slug);
    if (room.slideIndex !== slideIndex) return; // already moved

    io.to(getRoomId(slug)).emit('slide:timeout', { slideIndex });

    // Send correct answer reveal
    const q = questions[slideIndex];
    io.to(getRoomId(slug)).emit('slide:reveal', {
      slideIndex,
      config: q.config,
      type: q.type,
    });

    // Notify admin
    if (room.adminSocket) {
      io.to(room.adminSocket).emit('slide:timeout', { slideIndex });
    }

    slideTimeouts.delete(key);
  }, timeLimitSec * 1000 + 300); // +300ms server grace

  slideTimeouts.set(key, t);
}

async function endGame(io, slug, challengeId, totalSlides) {
  const room = getRoom(slug);
  room.phase = 'ENDED';

  // Final scoring & rank
  const sessions = await prisma.gameSession.findMany({
    where: { challengeId },
    orderBy: { totalScore: 'desc' },
  });

  await prisma.$transaction([
    ...sessions.map((s, i) =>
      prisma.gameSession.update({
        where: { id: s.id },
        data: { rank: i + 1, completedAt: new Date() },
      })
    ),
    prisma.challenge.update({ where: { id: challengeId }, data: { status: 'ENDED' } }),
    prisma.liveRoom.update({ where: { challengeId }, data: { phase: 'ENDED' } }),
  ]);

  const podium = sessions.slice(0, 10).map((s, i) => ({
    rank: i + 1,
    name: s.playerName,
    score: s.totalScore,
  }));

  io.to(getRoomId(slug)).emit('game:end', { podium });

  rooms.delete(slug);
  console.log(`[Game] Ended: ${slug}`);
}

module.exports = { setupGameSocket };
