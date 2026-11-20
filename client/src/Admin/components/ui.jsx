import { cn } from '../../lib/cn';

export function Cargando({ className }) {
  return (
    <div className={cn('flex min-h-[50vh] items-center justify-center', className)}>
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
    </div>
  );
}

// Título de cada sección del panel
export function Encabezado({ titulo, descripcion, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-2xl text-sm text-ink-500">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// Interruptor accesible (role="switch")
export function Toggle({ checked, onChange, label, descripcion, disabled }) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60')}>
      <span>
        <span className="block text-sm font-semibold text-ink-800">{label}</span>
        {descripcion && <span className="block text-xs text-ink-500">{descripcion}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition', checked ? 'bg-brand-500' : 'bg-ink-300')}
      >
        <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
      </button>
    </label>
  );
}

// Campo de solo lectura con etiqueta chica (fichas de detalle)
export function Dato({ label, children, className }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-ink-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ink-900">{children ?? '—'}</dd>
    </div>
  );
}

export const ESTADOS_PEDIDO = {
  pendiente: { label: 'Pendiente', tono: 'bg-amber-50 text-amber-700 ring-amber-200' },
  confirmado: { label: 'Confirmado', tono: 'bg-sky-50 text-sky-700 ring-sky-100' },
  preparando: { label: 'Preparando', tono: 'bg-violet-50 text-violet-700 ring-violet-200' },
  enviado: { label: 'Enviado', tono: 'bg-cyan-50 text-cyan-700 ring-cyan-200' },
  entregado: { label: 'Entregado', tono: 'bg-leaf-50 text-leaf-700 ring-leaf-100' },
  cancelado: { label: 'Cancelado', tono: 'bg-red-50 text-red-700 ring-red-100' },
};

export function EstadoPedido({ estado }) {
  const e = ESTADOS_PEDIDO[estado] || { label: estado, tono: 'bg-ink-100 text-ink-600 ring-ink-200' };
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', e.tono)}>{e.label}</span>;
}

export const fechaHora = (iso) => iso
  ? new Date(iso).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—';
