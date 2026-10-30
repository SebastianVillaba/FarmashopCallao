import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { nombreProducto } from '../lib/texto';
import { formatCurrency } from '../utils/formatCurrency';
import useDebounce from '../hooks/useDebounce';
import ProductImage from './ProductImage';
import { urlProducto } from './TarjetaProducto';

const MAX_SUGERENCIAS = 6;

// Buscador con sugerencias en vivo (teclado: flechas, Enter, Escape)
export default function SearchBox({ className, autoFocus, onNavigate }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [termino, setTermino] = useState(params.get('q') || '');
  const [sugerencias, setSugerencias] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const debounced = useDebounce(termino.trim(), 300);
  const contenedor = useRef(null);
  const listaId = useId();

  useEffect(() => {
    if (debounced.length < 3) {
      setSugerencias([]);
      setTotal(0);
      return;
    }
    const controller = new AbortController();
    setCargando(true);
    api.get('/productos/buscarProducto', { params: { palabra: debounced }, signal: controller.signal })
      .then(({ data }) => {
        const resultados = data.respuesta || [];
        setTotal(resultados.length);
        // Priorizar los que tienen imagen y stock
        setSugerencias(
          [...resultados]
            .sort((a, b) => (!!b.imagen - !!a.imagen) || ((b.stockTotal > 0) - (a.stockTotal > 0)))
            .slice(0, MAX_SUGERENCIAS)
        );
        setActivo(-1);
      })
      .catch(() => {})
      .finally(() => setCargando(false));
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    const cerrar = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('pointerdown', cerrar);
    return () => document.removeEventListener('pointerdown', cerrar);
  }, []);

  const irA = (url) => {
    setAbierto(false);
    onNavigate?.();
    navigate(url);
  };

  const buscar = () => {
    const q = termino.trim();
    if (q) irA(`/catalogo?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => Math.min(i + 1, sugerencias.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activo >= 0 && sugerencias[activo]) irA(urlProducto(sugerencias[activo]));
      else buscar();
    } else if (e.key === 'Escape') {
      setAbierto(false);
    }
  };

  const mostrarPanel = abierto && debounced.length >= 3 && (sugerencias.length > 0 || !cargando);

  return (
    <div ref={contenedor} className={cn('relative', className)}>
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); buscar(); }}
        className="group flex h-12 items-center rounded-full border border-ink-200 bg-ink-50 pr-1.5 pl-4 transition focus-within:border-brand-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-100 hover:border-ink-300"
      >
        <Search className="h-5 w-5 shrink-0 text-ink-400 group-focus-within:text-brand-500" />
        <input
          type="search"
          value={termino}
          autoFocus={autoFocus}
          onChange={(e) => { setTermino(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscá medicamentos, marcas, cuidado personal…"
          aria-label="Buscar productos"
          role="combobox"
          aria-expanded={mostrarPanel}
          aria-controls={listaId}
          aria-autocomplete="list"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {cargando && <Loader2 className="mr-2 h-4 w-4 animate-spin text-ink-400" />}
        {termino && !cargando && (
          <button type="button" onClick={() => setTermino('')} className="mr-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Limpiar búsqueda">
            <X className="h-4 w-4" />
          </button>
        )}
        <button type="submit" className="hidden h-9 cursor-pointer rounded-full bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600 sm:block">
          Buscar
        </button>
      </form>

      {mostrarPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-pop animate-fade-in">
          {sugerencias.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-ink-500">
              No encontramos productos para <strong className="text-ink-800">“{debounced}”</strong>
            </p>
          ) : (
            <>
              <ul id={listaId} role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
                {sugerencias.map((p, i) => (
                  <li key={p.idProducto} role="option" aria-selected={i === activo}>
                    <button
                      type="button"
                      onMouseEnter={() => setActivo(i)}
                      onClick={() => irA(urlProducto(p))}
                      className={cn('flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition', i === activo && 'bg-ink-50')}
                    >
                      <ProductImage src={p.imagen} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-ink-100" />
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-medium text-ink-800">{nombreProducto(p.nombreMercaderia)}</span>
                        <span className="text-xs text-ink-400">{p.nombreLab}</span>
                      </span>
                      <span className="text-right">
                        {p.precioAnterior > p.precio && (
                          <span className="block text-[11px] text-ink-400 line-through">{formatCurrency(p.precioAnterior)}</span>
                        )}
                        <span className={cn('text-sm font-bold', p.precioAnterior > p.precio ? 'text-brand-600' : 'text-ink-900')}>
                          {formatCurrency(p.precio)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={buscar}
                className="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-ink-100 bg-ink-50 py-3 text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                Ver los {total} resultados <Search className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
