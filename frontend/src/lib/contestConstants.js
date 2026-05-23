// Fechas de la campaña "El Gran Upgrade"
export const CONTEST_OPEN_DATE  = new Date('2026-06-01T06:00:00Z'); // 1 jun 00:00 GT (UTC-6)
export const CONTEST_CLOSE_DATE = new Date('2026-06-08T05:59:59Z'); // 7 jun 23:59 GT

export function isRegistrationOpen() {
  const now = new Date();
  return now >= CONTEST_OPEN_DATE && now <= CONTEST_CLOSE_DATE;
}

export function isVotingOpen() {
  // La votación se habilita cuando existen finalistas (el admin los marca)
  // Aquí puedes añadir un rango de fechas si es necesario
  return true;
}

// ─── Labels de enums ──────────────────────────────────────────────────────────

export const PROCESADOR_LABELS = {
  INTEL_I3_10A_14A: 'Intel Core i3 (10ª–14ª Gen)',
  INTEL_I5_10A_14A: 'Intel Core i5 (10ª–14ª Gen)',
  INTEL_I7_10A_14A: 'Intel Core i7 (10ª–14ª Gen)',
  INTEL_I9_10A_14A: 'Intel Core i9 (10ª–14ª Gen)',
  AMD_RYZEN_3:      'AMD Ryzen 3 (Serie 3000–9000)',
  AMD_RYZEN_5:      'AMD Ryzen 5 (Serie 3000–9000)',
  AMD_RYZEN_7:      'AMD Ryzen 7 (Serie 3000–9000)',
  AMD_RYZEN_9:      'AMD Ryzen 9 (Serie 3000–9000)',
  OTRO:             'Otro',
};

export const GRAFICA_LABELS = {
  GTX_10_SERIES: 'NVIDIA GeForce GTX 10 Series (1060/1070/1080)',
  GTX_16_SERIES: 'NVIDIA GeForce GTX 16 Series (1650/1660)',
  RTX_20_SERIES: 'NVIDIA GeForce RTX 20 Series (2060/2070/2080)',
  RTX_30_SERIES: 'NVIDIA GeForce RTX 30 Series (3060/3070/3080/3090)',
  RTX_40_SERIES: 'NVIDIA GeForce RTX 40 Series (4060/4070/4080/4090)',
  AMD_RX_5000:   'AMD Radeon RX 5000 Series',
  AMD_RX_6000:   'AMD Radeon RX 6000 Series',
  AMD_RX_7000:   'AMD Radeon RX 7000 Series',
  INTEL_ARC:     'Intel Arc',
  GPU_INTEGRADA: 'GPU Integrada (sin tarjeta dedicada)',
  OTRA:          'Otra',
};

export const FUENTE_LABELS = {
  MENOS_500W: 'Menos de 500W',
  W500_649:   '500W – 649W',
  W650_749:   '650W – 749W',
  W750_849:   '750W – 849W',
  W850_999:   '850W – 999W',
  MAS_1000W:  '1000W o más',
  NO_SE:      'No sé / No tengo',
};
