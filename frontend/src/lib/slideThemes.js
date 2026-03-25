export const GRADIENTS = {
  sunset: 'linear-gradient(135deg,#f97316,#ec4899)',
  ocean:  'linear-gradient(135deg,#0ea5e9,#6366f1)',
  forest: 'linear-gradient(135deg,#16a34a,#0d9488)',
  night:  'linear-gradient(135deg,#1e1b4b,#0f172a)',
  candy:  'linear-gradient(135deg,#a855f7,#ec4899)',
  gold:   'linear-gradient(135deg,#b45309,#f59e0b)',
  steel:  'linear-gradient(135deg,#334155,#0f172a)',
};

export const GRADIENT_PRESETS = [
  { id: 'none',   label: 'Sin gradiente', value: '' },
  { id: 'sunset', label: 'Atardecer',     value: GRADIENTS.sunset },
  { id: 'ocean',  label: 'Océano',        value: GRADIENTS.ocean },
  { id: 'forest', label: 'Bosque',        value: GRADIENTS.forest },
  { id: 'night',  label: 'Noche',         value: GRADIENTS.night },
  { id: 'candy',  label: 'Candy',         value: GRADIENTS.candy },
  { id: 'gold',   label: 'Dorado',        value: GRADIENTS.gold },
  { id: 'steel',  label: 'Acero',         value: GRADIENTS.steel },
];

export function resolveSlideBackground(sb) {
  if (!sb) return null;
  if (sb.type === 'color'    && sb.color)      return { background: sb.color };
  if (sb.type === 'gradient' && sb.gradientId) return { background: GRADIENTS[sb.gradientId] || '' };
  if (sb.type === 'image'    && sb.imageUrl)   return { backgroundImage: `url(${sb.imageUrl})`, backgroundSize: 'cover', backgroundPosition: `${sb.posX ?? 50}% ${sb.posY ?? 50}%` };
  return null;
}
