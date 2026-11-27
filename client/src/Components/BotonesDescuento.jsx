import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { RANGOS_DESCUENTO } from '../lib/descuentos';

// Accesos rápidos por % de descuento (abajo del carrusel y arriba de /ofertas).
// Botones sueltos y centrados, sin contenedor. Sólo se muestran los rangos que tienen productos.
const TAMANO = 'h-14 w-[calc(33.333%-0.5rem)] sm:h-[60px] sm:w-[180px]';

export default function BotonesDescuento({ activo, className }) {
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    api.get('/productos/descuentos/resumen')
      .then(({ data }) => setResumen(data.respuesta || {}))
      .catch(() => setResumen({}));
  }, []);

  const visibles = resumen ? RANGOS_DESCUENTO.filter((r) => resumen[r.id] > 0) : [];
  if (resumen && !visibles.length) return null;

  return (
    <nav aria-label="Comprar por descuento" className={cn('flex flex-wrap justify-center gap-3 sm:gap-4', className)}>
      {!resumen
        ? [0, 1, 2].map((i) => <span key={i} aria-hidden className={cn(TAMANO, 'animate-pulse rounded-2xl bg-ink-100')} />)
        : visibles.map((r) => (
          <Link
            key={r.id}
            to={`/ofertas?descuento=${r.id}`}
            aria-label={`${r.titulo} (${resumen[r.id]} productos)`}
            aria-current={activo === r.id ? 'page' : undefined}
            className={cn(
              TAMANO,
              'group relative flex items-center justify-center overflow-hidden rounded-2xl font-display text-[1.75rem] leading-none font-black tracking-tight text-white tabular-nums shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 sm:text-4xl',
              r.clases,
              activo && activo !== r.id && 'opacity-55 hover:opacity-100',
              activo === r.id && 'ring-4 ring-brand-200 ring-offset-2'
            )}
          >
            {/* Brillo diagonal al pasar el mouse */}
            <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-500 group-hover:left-[120%] group-hover:opacity-100" />
            <span className="relative drop-shadow-sm">{r.label}</span>
          </Link>
        ))}
    </nav>
  );
}
