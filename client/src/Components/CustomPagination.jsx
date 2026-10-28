import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

// Devuelve [1, '…', 4, 5, 6, '…', 12]
const rango = (actual, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const paginas = new Set([1, total, actual - 1, actual, actual + 1]);
  const lista = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return lista.flatMap((p, i) => (i > 0 && p - lista[i - 1] > 1 ? ['…', p] : [p]));
};

export default function CustomPagination({ page, count, onChange }) {
  if (count <= 1) return null;
  const btn = 'grid h-10 min-w-10 cursor-pointer place-items-center rounded-full px-3 text-sm font-semibold transition';

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Paginación">
      <button type="button" className={cn(btn, 'text-ink-600 hover:bg-white disabled:opacity-30')} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
        <ChevronLeft className="h-5 w-5" />
      </button>
      {rango(page, count).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-ink-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(btn, p === page ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30' : 'text-ink-700 hover:bg-white')}
          >
            {p}
          </button>
        )
      )}
      <button type="button" className={cn(btn, 'text-ink-600 hover:bg-white disabled:opacity-30')} disabled={page >= count} onClick={() => onChange(page + 1)} aria-label="Página siguiente">
        <ChevronRight className="h-5 w-5" />
      </button>
    </nav>
  );
}
