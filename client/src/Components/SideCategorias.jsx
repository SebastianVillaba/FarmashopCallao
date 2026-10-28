import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Check } from 'lucide-react';
import { cn } from '../lib/cn';
import { formatCurrency } from '../utils/formatCurrency';
import { capitalizar } from '../lib/texto';

function Seccion({ titulo, children }) {
  return (
    <section className="border-b border-ink-100 py-5 first:pt-0 last:border-0">
      <h3 className="mb-3 text-sm font-bold tracking-wide text-ink-900 uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

function Casilla({ checked, onChange, children, extra }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg py-1.5 text-sm text-ink-700 hover:text-ink-900">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className={cn(
        'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100',
        checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 bg-white'
      )}>
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="flex-1 truncate">{children}</span>
      {extra !== undefined && <span className="text-xs text-ink-400 tabular-nums">{extra}</span>}
    </label>
  );
}

// Panel de filtros del catálogo (se usa en el sidebar y en el drawer mobile)
export default function SideCategorias({ categorias, categoriaActiva, onCategoria, laboratorios, labsActivos, onToggleLab, precio, rangoPrecio, onPrecio, soloStock, onSoloStock }) {
  const [verTodosLabs, setVerTodosLabs] = useState(false);
  const labsVisibles = verTodosLabs ? laboratorios : laboratorios.slice(0, 8);
  const [precioLocal, setPrecioLocal] = useState(precio);
  const [precioPrevio, setPrecioPrevio] = useState(precio);

  // Sincronizar cuando cambia el filtro desde afuera (ej. "limpiar")
  if (precio[0] !== precioPrevio[0] || precio[1] !== precioPrevio[1]) {
    setPrecioPrevio(precio);
    setPrecioLocal(precio);
  }

  return (
    <div>
      {categorias?.length > 0 && (
        <Seccion titulo="Categoría">
          <ul className="space-y-0.5">
            {categorias.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onCategoria(c.id === categoriaActiva ? null : c.id)}
                  className={cn(
                    'w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-sm transition',
                    String(c.id) === String(categoriaActiva) ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                  )}
                >
                  {c.nombre}
                </button>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <Seccion titulo="Disponibilidad">
        <Casilla checked={soloStock} onChange={(e) => onSoloStock(e.target.checked)}>Sólo con stock</Casilla>
      </Seccion>

      {rangoPrecio[1] > rangoPrecio[0] && (
        <Seccion titulo="Precio">
          <Slider.Root
            className="relative flex h-6 w-full touch-none items-center select-none"
            min={rangoPrecio[0]}
            max={rangoPrecio[1]}
            step={1000}
            value={precioLocal}
            onValueChange={setPrecioLocal}
            onValueCommit={onPrecio}
            minStepsBetweenThumbs={1}
          >
            <Slider.Track className="relative h-1.5 grow rounded-full bg-ink-200">
              <Slider.Range className="absolute h-full rounded-full bg-brand-500" />
            </Slider.Track>
            {[0, 1].map((i) => (
              <Slider.Thumb
                key={i}
                aria-label={i === 0 ? 'Precio mínimo' : 'Precio máximo'}
                className="block h-5 w-5 cursor-grab rounded-full border-2 border-brand-500 bg-white shadow transition hover:scale-110 focus:ring-4 focus:ring-brand-100 focus:outline-none"
              />
            ))}
          </Slider.Root>
          <div className="mt-3 flex justify-between text-xs font-medium text-ink-600 tabular-nums">
            <span>{formatCurrency(precioLocal[0])}</span>
            <span>{formatCurrency(precioLocal[1])}</span>
          </div>
        </Seccion>
      )}

      {laboratorios.length > 1 && (
        <Seccion titulo="Laboratorio / Marca">
          <div className="space-y-0.5">
            {labsVisibles.map(({ nombre, cantidad }) => (
              <Casilla key={nombre} checked={labsActivos.includes(nombre)} onChange={() => onToggleLab(nombre)} extra={cantidad}>
                {capitalizar(nombre)}
              </Casilla>
            ))}
          </div>
          {laboratorios.length > 8 && (
            <button type="button" onClick={() => setVerTodosLabs((v) => !v)} className="mt-2 cursor-pointer text-sm font-semibold text-brand-600 hover:underline">
              {verTodosLabs ? 'Ver menos' : `Ver los ${laboratorios.length}`}
            </button>
          )}
        </Seccion>
      )}
    </div>
  );
}
