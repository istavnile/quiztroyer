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
  ns.to(`raffle:${slug}`).emit('raffle:roster', entries.map((e) => `${e.nombre} ${e.apellido}`));
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
        ns.to(`raffle:${slug}`).emit('raffle:count', room.participants.size);
        await broadcastRoster(ns, slug, raffle.id);
        console.log(`[Raffle] ${nombre} joined ${slug}. Total: ${room.participants.size}`);
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

        socket.emit('raffle:admin-ready', { raffle, participantCount: room.participants.size });
        console.log(`[Raffle] Admin joined control for ${slug}`);
      } catch {
        socket.emit('raffle:error', 'No autorizado');
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
        if (room.participants.has(socket.id)) {
          room.participants.delete(socket.id);
          ns.to(`raffle:${slug}`).emit('raffle:count', room.participants.size);
        }
        if (room.adminSocket === socket.id) room.adminSocket = null;
      }
    });
  });
}

module.exports = { setupRaffleSocket };
