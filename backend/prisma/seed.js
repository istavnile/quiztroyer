const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const challenge = await prisma.challenge.upsert({
    where: { slug: 'demo-quiz' },
    update: {},
    create: {
      name: 'Demo Quiz - Cultura General',
      slug: 'demo-quiz',
      pin: '1234',
      branding: {
        bgColor: '#0f172a',
        primaryColor: '#6366f1',
        accentColor: '#f59e0b',
        headerText: 'QUIZTROYER',
        footerText: 'Powered by Quiztroyer',
        logoUrl: '',
      },
      questions: {
        create: [
          {
            order: 0,
            type: 'QUIZ',
            prompt: '¿Cuál es la capital de Australia?',
            timeLimit: 20,
            config: {
              options: [
                { id: 'a', text: 'Sídney', isCorrect: false },
                { id: 'b', text: 'Melbourne', isCorrect: false },
                { id: 'c', text: 'Canberra', isCorrect: true },
                { id: 'd', text: 'Brisbane', isCorrect: false },
              ],
            },
          },
          {
            order: 1,
            type: 'TRUEFALSE',
            prompt: 'El agua hierve a 100°C a nivel del mar.',
            timeLimit: 15,
            config: {
              correctAnswer: true,
            },
          },
          {
            order: 2,
            type: 'PUZZLE',
            prompt: 'Ordena los planetas del Sistema Solar de más cercano a más lejano del Sol:',
            timeLimit: 30,
            config: {
              items: ['Mercurio', 'Venus', 'Tierra', 'Marte', 'Júpiter'],
            },
          },
          {
            order: 3,
            type: 'PINIMAGE',
            prompt: 'Haz clic sobre el país de Francia en el mapa:',
            timeLimit: 25,
            config: {
              imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Europe_location_map.svg/1200px-Europe_location_map.svg.png',
              correctX: 48.5,
              correctY: 48.0,
              radius: 7,
            },
          },
        ],
      },
    },
  });

  console.log(`Seed completado. Challenge: ${challenge.name} (slug: ${challenge.slug}, PIN: ${challenge.pin})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
