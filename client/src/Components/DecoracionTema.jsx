import { useMemo } from 'react';
import { Ghost, Snowflake, Zap } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

// Valores pseudoaleatorios estables para no recalcular en cada render
const particulas = (cantidad, semilla) => Array.from({ length: cantidad }, (_, i) => {
  const r = (n) => {
    const x = Math.sin((i + 1) * 9301 + semilla * 49297 + n * 233) * 10000;
    return x - Math.floor(x);
  };
  return { izquierda: r(1) * 100, demora: r(2) * -20, duracion: 10 + r(3) * 14, tamano: 8 + r(4) * 14, deriva: (r(5) - 0.5) * 120, opacidad: 0.35 + r(6) * 0.5 };
});

function Nieve({ cantidad }) {
  const copos = useMemo(() => particulas(cantidad, 1), [cantidad]);
  return (
    <div aria-hidden className="decoracion-animada pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {copos.map((c, i) => (
        <Snowflake
          key={i}
          className="absolute top-0 text-sky-200 drop-shadow"
          style={{
            left: `${c.izquierda}%`,
            width: c.tamano,
            height: c.tamano,
            opacity: c.opacidad,
            '--deriva': `${c.deriva}px`,
            animation: `caer ${c.duracion}s linear ${c.demora}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Fantasmas() {
  const lista = useMemo(() => particulas(4, 2), []);
  return (
    <div aria-hidden className="decoracion-animada pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {lista.map((f, i) => (
        <Ghost
          key={i}
          className="absolute text-brand-500/25"
          style={{
            left: i % 2 ? 'auto' : `${2 + f.izquierda / 12}%`,
            right: i % 2 ? `${2 + f.izquierda / 12}%` : 'auto',
            top: `${25 + i * 17}%`,
            width: 28 + f.tamano,
            height: 28 + f.tamano,
            animation: `flotar-tema ${5 + f.duracion / 4}s ease-in-out ${f.demora / 4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Decoración de la temática activa. En el panel (discreta) sólo se muestra una cinta fina.
export default function DecoracionTema({ discreta = false }) {
  const { tema } = useConfig();

  if (discreta) {
    if (tema === 'default') return null;
    return <div aria-hidden className="h-1 w-full bg-gradient-to-r from-brand-500 via-sky-500 to-brand-500 bg-[length:200%_100%]" style={{ animation: 'brillo-cyber 6s linear infinite' }} />;
  }

  if (tema === 'navidad') return <Nieve cantidad={28} />;
  if (tema === 'halloween') return <Fantasmas />;
  return null;
}

// Cinta superior propia de cada temática (va arriba de todo en la tienda)
export function CintaTema() {
  const { tema } = useConfig();
  if (tema !== 'cyberday') return null;
  return (
    <div
      className="flex h-8 items-center justify-center gap-2 bg-gradient-to-r from-brand-600 via-sky-500 to-brand-600 bg-[length:200%_100%] text-xs font-extrabold tracking-[0.2em] text-white uppercase"
      style={{ animation: 'brillo-cyber 5s linear infinite' }}
    >
      <Zap className="h-3.5 w-3.5" fill="currentColor" /> Cyberday · Descuentos exclusivos online <Zap className="h-3.5 w-3.5" fill="currentColor" />
    </div>
  );
}
