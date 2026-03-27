const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const raffleRooms = new Map();

function getRaffleRoom(slug) {
  if (!raffleRooms.has(slug)) {
    raffleRooms.set(slug, { slug, adminSocket: null, participants: new Map() });
  }
  return raffleRooms.get(slug);
}

async function broadcastRoster(ns, slug, raffleId) {
  const entries = await prisma.raffleEntry.findMany({
    where: { raffleId },
    select: { nombre: true, apellido: true },
    orderBy: { createdAt: 'asc' },
  });
  const count = entries.length;
  ns.to(`raffle:${slug}`).emit('raffle:roster', entries.map((e) => `${e.nombre} ${e.apellido}`));
  ns.to(`raffle:${slug}`).emit('raffle:count', count);
}

function setupRaffleSocket(io) {
  const ns = io.of('/raffle');

  ns.on('connection', (socket) => {

    socket.on('raffle:join', async ({ slug, entryId, nombre, apellido }) => {
      try {
        const raffle = await prisma.raffle.findUnique({ where: { slug } });
        if (!raffle) return socket.emit('raffle:error', 'Sorteo no encontrado');

        const room = getRaffleRoom(slug);
        room.participants.set(socket.id, { entryId, nombre, apellido });
        socket.join(`raffle:${slug}`);

        await prisma.raffleEntry.update({ where: { id: entryId }, data: { socketId: socket.id } });

        socket.emit('raffle:joined', { raffleName: raffle.name, status: raffle.status });
        await broadcastRoster(ns, slug, raffle.id);
        const dbCount = await prisma.raffleEntry.count({ where: { raffleId: raffle.id } });
        console.log(`[Raffle] ${nombre} joined ${slug}. Total registered: ${dbCount}`);
      } catch (err) {
        console.error('[Raffle join error]', err.message);
      }
    });

    socket.on('raffle:admin-join', async ({ slug, token }) => {
      try {
        const jwt = require('jsonwebtoken');
        jwt.verify(token, process.env.JWT_SECRET);

        const raffle = await prisma.raffle.findUnique({
          where: { slug },
          include: { entries: { orderBy: { createdAt: 'asc' } } },
        });
        if (!raffle) return socket.emit('raffle:error', 'Sorteo no encontrado');

        const room = getRaffleRoom(slug);
        room.adminSocket = socket.id;
        socket.join(`raffle:${slug}`);

        const adminCount = await prisma.raffleEntry.count({ where: { raffleId: raffle.id } });
        socket.emit('raffle:admin-ready', { raffle, participantCount: adminCount });
        console.log(`[Raffle] Admin joined control for ${slug}`);
      } catch {
        socket.emit('raffle:error', 'No autorizado');
      }
    });

    // Display screen joins (no auth, projection mode)
    socket.on('raffle:display-join', async ({ slug }) => {
      try {
        const raffle = await prisma.raffle.findUnique({
          where: { slug },
          include: { entries: { select: { nombre: true, apellido: true, isWinner: true }, orderBy: { createdAt: 'asc' } } },
        });
        if (!raffle) return socket.emit('raffle:error', 'Sorteo no encontrado');

        const room = getRaffleRoom(slug);
        socket.join(`raffle:${slug}`);
        socket.data = { displaySlug: slug };

        const winner = raffle.entries.find((e) => e.isWinner) || null;
        const displayCount = raffle.entries.length;
        socket.emit('raffle:display-ready', {
          raffle: { name: raffle.name, slug: raffle.slug, branding: raffle.branding, status: raffle.status },
          participantCount: displayCount,
          names: raffle.entries.map((e) => `${e.nombre} ${e.apellido}`),
          winner,
        });
      } catch (err) {
        console.error('[Display join error]', err.message);
      }
    });

    // Admin triggers a spin (spinNumber: 1 | 2 | 3)
    socket.on('raffle:spin', async ({ slug, spinNumber }) => {
      try {
        const room = getRaffleRoom(slug);
        if (room.adminSocket !== socket.id) return;

        const raffle = await prisma.raffle.findUnique({ where: { slug } });
        const entries = await prisma.raffleEntry.findMany({ where: { raffleId: raffle.id } });
        if (entries.length === 0) return socket.emit('raffle:error', 'No hay participantes');

        // Pick a random featured name for this spin
        const featured = entries[Math.floor(Math.random() * entries.length)];

        // Start spinning animation (word cloud goes chaotic)
        ns.to(`raffle:${slug}`).emit('raffle:spinning', { spinNumber });

        if (spinNumber < 3) {
          // After 4s of animation, reveal a random name (not necessarily the winner)
          setTimeout(() => {
            ns.to(`raffle:${slug}`).emit('raffle:spin-result', {
              spinNumber,
              nombre: featured.nombre,
              apellido: featured.apellido,
            });
          }, 4000);
          console.log(`[Raffle] Spin ${spinNumber} in ${slug}, featuring: ${featured.nombre}`);
        } else {
          // Spin 3 = pick winner
          await prisma.raffleEntry.update({ where: { id: featured.id }, data: { isWinner: true } });
          await prisma.raffle.update({ where: { slug }, data: { status: 'DONE' } });

          setTimeout(() => {
            ns.to(`raffle:${slug}`).emit('raffle:winner', {
              nombre: featured.nombre,
              apellido: featured.apellido,
              dni: featured.dni,
              correo: featured.correo,
              telefono: featured.telefono,
            });
          }, 4000);
          console.log(`[Raffle] Winner in ${slug}: ${featured.nombre} ${featured.apellido}`);
        }
      } catch (err) {
        console.error('[Raffle spin error]', err.message);
      }
    });

    socket.on('disconnect', () => {
      for (const [slug, room] of raffleRooms.entries()) {
        // Only clean up socket tracking — DB count is the source of truth, don't emit raffle:count
        if (room.participants.has(socket.id)) room.participants.delete(socket.id);
        if (room.adminSocket === socket.id) room.adminSocket = null;
      }
    });
  });
}

module.exports = { setupRaffleSocket };
