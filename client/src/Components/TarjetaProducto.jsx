import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Plus } from 'lucide-react';
import ProductImage from './ProductImage';
import { Skeleton } from '../ui/misc';
import { cn } from '../lib/cn';
import { nombreProducto, capitalizar, porcentajeDescuento } from '../lib/texto';
import { formatCurrency } from '../utils/formatCurrency';
import { selectEsFavorito, toggleFavorito } from '../redux/favoritosSlice';
import useAgregarAlCarrito from '../hooks/useCarrito';

export const urlProducto = (p) => `/detalle/${p.idProducto}/${p.slug}`;

export default function TarjetaProducto({ producto, className }) {
  const dispatch = useDispatch();
  const agregar = useAgregarAlCarrito();
  const esFavorito = useSelector(selectEsFavorito(producto.idProducto));
  const sinStock = producto.stockTotal !== undefined && producto.stockTotal <= 0;
  const nombre = nombreProducto(producto.nombreMercaderia);
  const descuento = porcentajeDescuento(producto);

  return (
    <article className={cn(
      'group relative flex flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
      className
    )}>
      <Link to={urlProducto(producto)} className="block" aria-label={nombre}>
        <ProductImage
          src={producto.imagen}
          alt={nombre}
          imgClassName="group-hover:scale-105"
          sizes="(min-width: 1024px) 240px, 50vw"
        />
      </Link>

      <button
        type="button"
        onClick={() => dispatch(toggleFavorito(producto))}
        aria-label={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-pressed={esFavorito}
        className={cn(
          'absolute top-3 right-3 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-ink-100 backdrop-blur transition hover:scale-110',
          esFavorito ? 'text-brand-500' : 'text-ink-400 hover:text-brand-500'
        )}
      >
        <Heart className="h-4.5 w-4.5" fill={esFavorito ? 'currentColor' : 'none'} />
      </button>

      {(sinStock || descuento > 0) && (
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {descuento > 0 && (
            <span className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-sm shadow-brand-500/30">
              -{descuento}%
            </span>
          )}
          {sinStock && (
            <span className="rounded-full bg-ink-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">Sin stock</span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1 border-t border-ink-100 p-4">
        {producto.nombreLab && (
          <p className="truncate text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            {capitalizar(producto.nombreLab)}
          </p>
        )}
        <Link
          to={urlProducto(producto)}
          className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-medium text-ink-800 transition hover:text-brand-600"
        >
          {nombre}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {descuento > 0 && (
              <p className="text-xs text-ink-400 line-through">{formatCurrency(producto.precioAnterior)}</p>
            )}
            <p className={cn('font-display text-base font-extrabold sm:text-lg', descuento > 0 ? 'text-brand-600' : 'text-ink-900')}>
              {formatCurrency(producto.precio)}
            </p>
          </div>
          <button
            type="button"
            disabled={sinStock}
            onClick={() => agregar(producto)}
            aria-label={`Agregar ${nombre} al carrito`}
            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full bg-brand-500 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-500 disabled:shadow-none"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function TarjetaProductoSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function GrillaProductos({ productos, cargando, cantidadSkeleton = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {cargando
        ? Array.from({ length: cantidadSkeleton }, (_, i) => <TarjetaProductoSkeleton key={i} />)
        : productos.map((p) => <TarjetaProducto key={p.idProducto} producto={p} />)}
    </div>
  );
}
