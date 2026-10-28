import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import TarjetaProducto, { TarjetaProductoSkeleton } from './TarjetaProducto';
import { api } from '../lib/api';

// Carrusel horizontal de productos con encabezado
export function CarruselProductos({ titulo, subtitulo, verTodo, productos, cargando }) {
  const [emblaRef, embla] = useEmblaCarousel({ align: 'start', slidesToScroll: 'auto', containScroll: 'trimSnaps' });
  const [puede, setPuede] = useState({ prev: false, next: false });

  useEffect(() => {
    if (!embla) return;
    const actualizar = () => setPuede({ prev: embla.canScrollPrev(), next: embla.canScrollNext() });
    actualizar();
    embla.on('select', actualizar).on('reInit', actualizar);
    return () => embla.off('select', actualizar).off('reInit', actualizar);
  }, [embla]);

  if (!cargando && !productos.length) return null;

  const flecha = 'grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-default disabled:opacity-40';

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{titulo}</h2>
          {subtitulo && <p className="mt-1 text-ink-500">{subtitulo}</p>}
        </div>
        <div className="flex items-center gap-2">
          {verTodo && (
            <Link to={verTodo} className="mr-2 hidden items-center gap-1 text-sm font-semibold text-brand-600 transition-all hover:gap-2 sm:flex">
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <button type="button" className={flecha} disabled={!puede.prev} onClick={() => embla?.scrollPrev()} aria-label="Anterior">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" className={flecha} disabled={!puede.next} onClick={() => embla?.scrollNext()} aria-label="Siguiente">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div ref={emblaRef} className="-mx-2 overflow-hidden px-2 py-2">
        <div className="-ml-4 flex">
          {(cargando ? Array.from({ length: 5 }) : productos).map((p, i) => (
            <div key={p?.idProducto ?? i} className="min-w-0 flex-[0_0_50%] pl-4 sm:flex-[0_0_33.333%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]">
              {cargando ? <TarjetaProductoSkeleton /> : <TarjetaProducto producto={p} className="h-full" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductosDestacados() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/productos/destacados', { params: { limit: 15 } })
      .then(({ data }) => setProductos(data.respuesta || []))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <CarruselProductos
      titulo="Destacados de la semana"
      subtitulo="Lo más elegido en nuestras farmacias"
      verTodo="/catalogo"
      productos={productos}
      cargando={cargando}
    />
  );
}
