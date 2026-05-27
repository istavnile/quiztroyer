const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ── Demo challenge ────────────────────────────────────────────────────────
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
                { id: 'a', text: 'Sídney',    isCorrect: false },
                { id: 'b', text: 'Melbourne', isCorrect: false },
                { id: 'c', text: 'Canberra',  isCorrect: true  },
                { id: 'd', text: 'Brisbane',  isCorrect: false },
              ],
            },
          },
          {
            order: 1,
            type: 'TRUEFALSE',
            prompt: 'El agua hierve a 100°C a nivel del mar.',
            timeLimit: 15,
            config: { correctAnswer: true },
          },
          {
            order: 2,
            type: 'PUZZLE',
            prompt: 'Ordena los planetas del Sistema Solar de más cercano a más lejano del Sol:',
            timeLimit: 30,
            config: { items: ['Mercurio', 'Venus', 'Tierra', 'Marte', 'Júpiter'] },
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

  // ── Site settings (homepage) ──────────────────────────────────────────────
  // update:{} → no overwrite if admin already customized them
  await prisma.siteSettings.upsert({
    where:  { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      data: {
        blob1Color:       '#6366f1',
        blob2Color:       '#a855f7',
        blob3Color:       '#ec4899',
        homeBgColor:      '#0f172a',
        homeButtonColor:  '#4f46e5',
        logoUrl:          '',
        bgEffect:         'blobs',
      },
    },
  });

  // ── Contest settings ("El Gran Upgrade") ─────────────────────────────────
  await prisma.contestSettings.upsert({
    where:  { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      data: {
        titulo:    'El Upgrade de lo que realmente importa.',
        tituloVw:  7,
        subtitulo: 'Muéstranos tu PC y cuéntanos tu historia. ¡El mejor setup ganará un upgrade épico!',
        badge:     'CONCURSO PATROCINADO POR NVIDIA · ASUS ROG · COMPUTERSHOP',
        imagenHero: '',
        textoFechaApertura: '1 de junio, 2026',
        textoFechaCierre:   '7 de junio, 23:59',
        textoFechaFinal:    '12 de junio, 2026',
        patrocinadores: [
          { nombre: 'NVIDIA',       logoUrl: '', color: '#76B900', logoAltura: 52 },
          { nombre: 'ASUS ROG',     logoUrl: '', color: '#e61f30', logoAltura: 40 },
          { nombre: 'ComputerShop', logoUrl: '', color: '#ffffff', logoAltura: 36 },
        ],
        pasos: [
          { numero: '01', titulo: 'Inscríbete',            descripcion: 'Llena el formulario con los datos de tu PC, sube fotos y cuenta tu historia en máximo 150 palabras.' },
          { numero: '02', titulo: 'Espera los finalistas', descripcion: 'Nuestro equipo revisará todas las participaciones y seleccionará los mejores setups.' },
          { numero: '03', titulo: 'Vota y comparte',       descripcion: 'Del 8 al 11 de junio, la comunidad vota por sus favoritos. ¡El ganador anunciado en vivo el 12 de junio!' },
        ],
        premios: [
          { posicion: '1er lugar', descripcion: 'ASUS NVIDIA GeForce RTX 5060 Ti', color: '#76B900', imagenUrl: '' },
        ],
        techBgEnabled:           true,
        techBgOpacity:           1.0,
        techBgTerms: [
          'DLSS 3', 'REFLEX', 'RAY TRACING', 'RTX ON', 'TENSOR CORES',
          'CUDA', 'G-SYNC', 'NVENC', 'FRAME GENERATION', 'ACE', 'BROADCAST',
          'ADA LOVELACE', 'AMPERE', 'NVLINK', 'AI DENOISING', 'OVERDRIVE',
          'DEEP LEARNING', 'BLACKWELL', 'GDDR7', 'DLSS 4', 'MULTI FRAME GEN',
        ],
        tituloFormulario:        'Formulario de inscripción',
        instruccionesFormulario: 'Completa todos los campos. Las inscripciones cierran el 7 de junio a las 23:59.',
        campos: [
          { id: 'nombre',    tipo: 'text',  label: 'Nombre completo',      placeholder: 'Tu nombre',          requerido: true,  ancho: 'half',  sistema: true },
          { id: 'email',     tipo: 'email', label: 'Correo electrónico',   placeholder: 'correo@ejemplo.com', requerido: true,  ancho: 'half',  sistema: true },
          { id: 'telefono',  tipo: 'tel',   label: 'Teléfono',             placeholder: '+502 0000-0000',     requerido: true,  ancho: 'half',  sistema: true },
          { id: 'procesador', tipo: 'select', label: 'Procesador', placeholder: 'Selecciona...', requerido: true, ancho: 'third', sistema: true,
            opciones: [
              { valor: 'INTEL_I3_10A_14A', etiqueta: 'Intel Core i3 (10ª–14ª Gen)' },
              { valor: 'INTEL_I5_10A_14A', etiqueta: 'Intel Core i5 (10ª–14ª Gen)' },
              { valor: 'INTEL_I7_10A_14A', etiqueta: 'Intel Core i7 (10ª–14ª Gen)' },
              { valor: 'INTEL_I9_10A_14A', etiqueta: 'Intel Core i9 (10ª–14ª Gen)' },
              { valor: 'AMD_RYZEN_3', etiqueta: 'AMD Ryzen 3 (Serie 3000–9000)' },
              { valor: 'AMD_RYZEN_5', etiqueta: 'AMD Ryzen 5 (Serie 3000–9000)' },
              { valor: 'AMD_RYZEN_7', etiqueta: 'AMD Ryzen 7 (Serie 3000–9000)' },
              { valor: 'AMD_RYZEN_9', etiqueta: 'AMD Ryzen 9 (Serie 3000–9000)' },
              { valor: 'OTRO', etiqueta: 'Otro' },
            ],
          },
          { id: 'graficaActual', tipo: 'select', label: 'Gráfica actual', placeholder: 'Selecciona...', requerido: true, ancho: 'third', sistema: true,
            opciones: [
              { valor: 'GTX_10_SERIES', etiqueta: 'NVIDIA GeForce GTX 10 Series (1060/1070/1080)' },
              { valor: 'GTX_16_SERIES', etiqueta: 'NVIDIA GeForce GTX 16 Series (1650/1660)' },
              { valor: 'RTX_20_SERIES', etiqueta: 'NVIDIA GeForce RTX 20 Series (2060/2070/2080)' },
              { valor: 'RTX_30_SERIES', etiqueta: 'NVIDIA GeForce RTX 30 Series (3060/3070/3080/3090)' },
              { valor: 'RTX_40_SERIES', etiqueta: 'NVIDIA GeForce RTX 40 Series (4060/4070/4080/4090)' },
              { valor: 'AMD_RX_5000',   etiqueta: 'AMD Radeon RX 5000 Series' },
              { valor: 'AMD_RX_6000',   etiqueta: 'AMD Radeon RX 6000 Series' },
              { valor: 'AMD_RX_7000',   etiqueta: 'AMD Radeon RX 7000 Series' },
              { valor: 'INTEL_ARC',     etiqueta: 'Intel Arc' },
              { valor: 'GPU_INTEGRADA', etiqueta: 'GPU Integrada (sin tarjeta dedicada)' },
              { valor: 'OTRA',          etiqueta: 'Otra' },
            ],
          },
          { id: 'fuentePoderWatts', tipo: 'select', label: 'Fuente de poder', placeholder: 'Selecciona...', requerido: true, ancho: 'third', sistema: true,
            opciones: [
              { valor: 'MENOS_500W', etiqueta: 'Menos de 500W' },
              { valor: 'W500_649',   etiqueta: '500W – 649W' },
              { valor: 'W650_749',   etiqueta: '650W – 749W' },
              { valor: 'W750_849',   etiqueta: '750W – 849W' },
              { valor: 'W850_999',   etiqueta: '850W – 999W' },
              { valor: 'MAS_1000W',  etiqueta: '1000W o más' },
              { valor: 'NO_SE',      etiqueta: 'No sé / No tengo' },
            ],
          },
          { id: 'fotoExterior', tipo: 'file', label: 'Foto exterior (gabinete / setup)', hint: 'Vista frontal o general de tu setup',             requerido: true, ancho: 'half', sistema: true },
          { id: 'fotoInterior', tipo: 'file', label: 'Foto interior (componentes)',        hint: 'Interior del gabinete con componentes visibles', requerido: true, ancho: 'half', sistema: true },
          { id: 'historia',    tipo: 'textarea', label: '¿Por qué mereces el Gran Upgrade?', placeholder: 'Comparte tu historia, tu pasión por la tecnología y por qué tu setup necesita un upgrade...', requerido: true, ancho: 'full', sistema: true, maxPalabras: 150 },
          { id: 'aceptaTyC',       tipo: 'checkbox', label: 'Acepto los Términos y Condiciones del concurso', url: '#tyc', requerido: true,  ancho: 'full', sistema: true },
          { id: 'aceptaMarketing', tipo: 'checkbox', label: 'Acepto recibir comunicaciones comerciales de NVIDIA, ASUS y ComputerShop', requerido: false, ancho: 'full', sistema: true },
        ],
      },
    },
  });

  console.log(`✓ Challenge: ${challenge.name} (PIN: ${challenge.pin})`);
  console.log('✓ SiteSettings seeded');
  console.log('✓ ContestSettings seeded');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
