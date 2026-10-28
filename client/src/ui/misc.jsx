import { Check, Minus, Plus } from 'lucide-react';
import { cn } from '../lib/cn';

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-xl bg-ink-200/70', className)} />;
}

const TONOS = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  leaf: 'bg-leaf-50 text-leaf-700 ring-leaf-100',
  ink: 'bg-ink-100 text-ink-600 ring-ink-200',
  danger: 'bg-red-50 text-red-700 ring-red-100',
};

export function Badge({ tone = 'ink', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', TONOS[tone], className)}>
      {children}
    </span>
  );
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md', className }) {
  const btn = cn(
    'grid cursor-pointer place-items-center rounded-full text-ink-700 transition hover:bg-white hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40',
    size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
  );
  return (
    <div className={cn('inline-flex items-center rounded-full bg-ink-100 p-1', className)}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Restar uno">
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn('text-center font-semibold tabular-nums text-ink-900', size === 'sm' ? 'w-7 text-sm' : 'w-10')}>{value}</span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Sumar uno">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Stepper({ pasos, actual }) {
  return (
    <ol className="flex items-center gap-2">
      {pasos.map((paso, i) => {
        const hecho = i < actual;
        const activo = i === actual;
        return (
          <li key={paso} className={cn('flex items-center gap-2', i < pasos.length - 1 && 'flex-1')}>
            <span className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition',
              hecho && 'bg-brand-500 text-white',
              activo && 'bg-brand-50 text-brand-600 ring-2 ring-brand-500',
              !hecho && !activo && 'bg-ink-100 text-ink-400'
            )}>
              {hecho ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('hidden text-sm font-semibold whitespace-nowrap sm:block', activo ? 'text-ink-900' : 'text-ink-500')}>{paso}</span>
            {i < pasos.length - 1 && (
              <span className={cn('h-0.5 min-w-4 flex-1 rounded-full', hecho ? 'bg-brand-500' : 'bg-ink-200')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Bloque blanco con borde suave, base de casi todas las secciones
export function Card({ as: Tag = 'div', className, ...props }) {
  return <Tag className={cn('rounded-3xl border border-ink-100 bg-white shadow-card', className)} {...props} />;
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      {Icon && (
        <span className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-500">
          <Icon className="h-9 w-9" strokeWidth={1.6} />
        </span>
      )}
      <h3 className="text-xl font-bold">{title}</h3>
      {children && <p className="mt-2 max-w-sm text-ink-500">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
