const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// In-memory raffle rooms: slug -> { adminSocket, participants: Map(socketId -> {entryId, nombre, apellido}) }
const raffleRooms = new Map();

function getRaffleRoom(slug) {
  if (!raffleRooms.has(slug)) {
    raffleRooms.set(slug, { slug, adminSocket: null, participants: new Map() });
  }
  return raffleRooms.get(slug);
}

function setupRaffleSocket(io) {
  const ns = io.of('/raffle');

  ns.on('connection', (socket) => {

    // Player joins raffle lobby
    socket.on('raffle:join', async ({ slug, entryId, nombre, apellido }) => {
      try {
        const raffle = await prisma.raffle.findUnique({ where: { slug } });
        if (!raffle) return socket.emit('raffle:error', 'Sorteo no encontrado');

        const room = getRaffleRoom(slug);
        room.participants.set(socket.id, { entryId, nombre, apellido });
        socket.join(`raffle:${slug}`);

        // Update socketId in DB
        await prisma.raffleEntry.update({ where: { id: entryId }, data: { socketId: socket.id } });

        socket.emit('raffle:joined', { raffleName: raffle.name, status: raffle.status });
        ns.to(`raffle:${slug}`).emit('raffle:count', room.participants.size);
        console.log(`[Raffle] ${nombre} joined ${slug}. Total: ${room.participants.size}`);
      } catch (err) {
        console.error('[Raffle join error]', err.message);
      }
    });

    // Admin joins control room
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

        socket.emit('raffle:admin-ready', {
          raffle,
          participantCount: room.participants.size,
        });
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

        if (spinNumber < 3) {
          // Spins 1 and 2 — just animate, no winner yet
          ns.to(`raffle:${slug}`).emit('raffle:spinning', { spinNumber });
          console.log(`[Raffle] Spin ${spinNumber} in ${slug}`);
        } else {
          // Spin 3 — pick winner
          const entries = await prisma.raffleEntry.findMany({
            where: { raffleId: (await prisma.raffle.findUnique({ where: { slug } })).id },
          });
          if (entries.length === 0) return socket.emit('raffle:error', 'No hay participantes');

          const winner = entries[Math.floor(Math.random() * entries.length)];

          await prisma.raffleEntry.update({ where: { id: winner.id }, data: { isWinner: true } });
          await prisma.raffle.update({ where: { slug }, data: { status: 'DONE' } });

          ns.to(`raffle:${slug}`).emit('raffle:spinning', { spinNumber: 3 });

          // Short delay so animation plays before winner reveal
          setTimeout(() => {
            ns.to(`raffle:${slug}`).emit('raffle:winner', {
              nombre: winner.nombre,
              apellido: winner.apellido,
              dni: winner.dni,
              correo: winner.correo,
              telefono: winner.telefono,
            });
          }, 3000);

          console.log(`[Raffle] Winner in ${slug}: ${winner.nombre} ${winner.apellido}`);
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
