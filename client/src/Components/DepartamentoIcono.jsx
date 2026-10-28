import { Apple, Baby, Droplets, Flower2, Gift, HeartPulse, Palette, Pill, Sparkles, Wind } from 'lucide-react';
import { cn } from '../lib/cn';

const ICONOS = { Apple, Baby, Droplets, Flower2, Gift, HeartPulse, Palette, Pill, Sparkles, Wind };

const COLORES = {
  brand: 'bg-brand-50 text-brand-600',
  sky: 'bg-sky-50 text-sky-600',
  leaf: 'bg-leaf-50 text-leaf-600',
  ink: 'bg-ink-100 text-ink-600',
};

export default function DepartamentoIcono({ departamento, className, iconClassName }) {
  const Icono = ICONOS[departamento.icono] || Gift;
  return (
    <span className={cn('grid place-items-center rounded-2xl', COLORES[departamento.color] || COLORES.ink, className)}>
      <Icono className={cn('h-5 w-5', iconClassName)} strokeWidth={1.8} />
    </span>
  );
}
