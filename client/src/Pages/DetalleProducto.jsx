import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Heart, PackageX, Share2, ShieldCheck, ShoppingBag, Store, Truck } from 'lucide-react';
import { toast } from 'sonner';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import ProductImage from '../Components/ProductImage';
import { CarruselProductos } from '../Components/ProductosDestacados';
import { WhatsAppLogo } from '../Components/FloatingBubble';
import Button, { buttonClasses } from '../ui/Button';
import { Badge, EmptyState, QuantityStepper, Skeleton } from '../ui/misc';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { capitalizar, nombreProducto, porcentajeDescuento, whatsappUrl } from '../lib/texto';
import { formatCurrency } from '../utils/formatCurrency';
import { selectEsFavorito, toggleFavorito } from '../redux/favoritosSlice';
import { setShowCart } from '../redux/cartSlice';
import useAgregarAlCarrito from '../hooks/useCarrito';
import { COSTO_DELIVERY, TIENDA } from '../config/tienda';

// Galería: swipe en mobile, miniaturas y zoom al pasar el mouse en desktop
function Galeria({ imagenes, nombre }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: imagenes.length > 1 });
  const [actual, setActual] = useState(0);
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setActual(embla.selectedScrollSnap());
    embla.on('select', onSelect);
    return () => embla.off('select', onSelect);
  }, [embla]);

  const lista = imagenes.length ? imagenes : [null];

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {lista.length > 1 && (
        <div className="scrollbar-none flex gap-3 overflow-x-auto lg:max-h-[560px] lg:flex-col lg:overflow-y-auto">
          {lista.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => embla?.scrollTo(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                'shrink-0 cursor-pointer overflow-hidden rounded-2xl border-2 transition',
                i === actual ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <ProductImage src={src} alt="" className="h-18 w-18 lg:h-20 lg:w-20" />
            </button>
          ))}
        </div>
      )}

      <div className="group relative flex-1 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {lista.map((src, i) => (
              <div
                key={src ?? i}
                className="relative min-w-0 flex-[0_0_100%] lg:cursor-zoom-in"
                onMouseMove={src ? onMove : undefined}
                onMouseLeave={() => setZoom(null)}
              >
                <ProductImage src={src} alt={`${nombre}${i ? ` (imagen ${i + 1})` : ''}`} eager={i === 0} />
                {zoom && src && i === actual && (
                  <div
                    className="pointer-events-none absolute inset-0 hidden bg-white bg-no-repeat lg:block"
                    style={{ backgroundImage: `url("${src}")`, backgroundSize: '220%', backgroundPosition: `${zoom.x}% ${zoom.y}%` }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {lista.length > 1 && (
          <>
            {[['left-3', ChevronLeft, () => embla?.scrollPrev(), 'Anterior'], ['right-3', ChevronRight, () => embla?.scrollNext(), 'Siguiente']].map(([pos, Icono, fn, label]) => (
              <button key={label} type="button" onClick={fn} aria-label={`Imagen ${label.toLowerCase()}`} className={cn('absolute top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 shadow-card transition hover:bg-white lg:opacity-0 lg:group-hover:opacity-100', pos)}>
                <Icono className="h-5 w-5" />
              </button>
            ))}
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
              {lista.map((_, i) => (
                <span key={i} className={cn('h-1.5 rounded-full bg-ink-800 transition-all', i === actual ? 'w-5' : 'w-1.5 opacity-25')} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetalleSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-3xl" />
      <div className="space-y-4 py-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-8 h-12 w-48" />
        <Skeleton className="mt-8 h-14 w-full rounded-full" />
      </div>
    </div>
  );
}

export default function DetalleProducto() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const agregar = useAgregarAlCarrito();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [similares, setSimilares] = useState([]);
  const esFavorito = useSelector(selectEsFavorito(Number(id)));
  const enCarrito = useSelector((state) => state.carrito.cartData.find((i) => i.idProducto === Number(id))?.cantidad || 0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setCantidad(1);
    setSimilares([]);
    api.get('/productos/getProductoById', { params: { id }, signal: controller.signal })
      .then(({ data }) => setProduct(data.respuesta))
      .catch((err) => err.name !== 'CanceledError' && setError(err))
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [id]);

  // Productos similares: búsqueda por la primera palabra del nombre
  useEffect(() => {
    const palabra = product?.nombreMercaderia?.split(/[\s,]+/).find((w) => w.length >= 4);
    if (!palabra) return;
    api.get('/productos/buscarProducto', { params: { palabra } })
      .then(({ data }) => setSimilares(
        (data.respuesta || [])
          .filter((p) => p.idProducto !== product.idProducto && p.stockTotal > 0)
          .sort((a, b) => !!b.imagen - !!a.imagen)
          .slice(0, 12)
      ))
      .catch(() => {});
  }, [product]);

  if (loading) {
    return <div className="container-page pt-6"><Skeleton className="mb-8 h-4 w-64" /><DetalleSkeleton /></div>;
  }

  if (error || !product) {
    return (
      <div className="container-page pt-10">
        <EmptyState icon={PackageX} title="No encontramos este producto" action={<Link to="/catalogo" className={buttonClasses()}>Ir al catálogo</Link>}>
          Puede que ya no esté disponible.
        </EmptyState>
      </div>
    );
  }

  const nombre = nombreProducto(product.nombreMercaderia);
  const stock = Number(product.stockTotal) || 0;
  const maxCantidad = Math.max(0, Math.min(stock - enCarrito, 99));
  const sinStock = stock <= 0;

  const compartir = async () => {
    const datos = { title: nombre, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(datos);
      else {
        await navigator.clipboard.writeText(datos.url);
        toast.success('Enlace copiado');
      }
    } catch {
      // el usuario canceló
    }
  };

  return (
    <div className="container-page pt-6">
      <title>{`${nombre} · Farmashop`}</title>
      <CustomBreadcrumbs items={[{ label: 'Catálogo', to: '/catalogo' }, { label: nombre }]} />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Galeria imagenes={product.imagenes || []} nombre={nombre} />

        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              {product.nombreLab && (
                <p className="text-sm font-semibold tracking-wide text-brand-600 uppercase">{capitalizar(product.nombreLab)}</p>
              )}
              <h1 className="mt-2 text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl lg:text-4xl">{nombre}</h1>
              <p className="mt-2 text-sm text-ink-400">Código: {product.codigo}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={compartir} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-ink-200 bg-white text-ink-600 transition hover:text-brand-600" aria-label="Compartir">
                <Share2 className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => dispatch(toggleFavorito(product))}
                aria-pressed={esFavorito}
                aria-label={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                className={cn('grid h-11 w-11 cursor-pointer place-items-center rounded-full border bg-white transition', esFavorito ? 'border-brand-200 text-brand-500' : 'border-ink-200 text-ink-600 hover:text-brand-600')}
              >
                <Heart className="h-5 w-5" fill={esFavorito ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {porcentajeDescuento(product) > 0 ? (
              <div>
                <p className="flex items-center gap-2 text-sm text-ink-400">
                  <span className="line-through">{formatCurrency(product.precioAnterior)}</span>
                  <Badge tone="brand">-{porcentajeDescuento(product)}%</Badge>
                </p>
                <p className="font-display text-4xl font-extrabold text-brand-600">{formatCurrency(product.precio)}</p>
              </div>
            ) : (
              <p className="font-display text-4xl font-extrabold text-ink-900">{formatCurrency(product.precio)}</p>
            )}
            {sinStock ? (
              <Badge tone="danger">Sin stock</Badge>
            ) : stock <= 5 ? (
              <Badge tone="brand">¡Últimas {stock} unidades!</Badge>
            ) : (
              <Badge tone="leaf">En stock</Badge>
            )}
          </div>

          <div className="mt-8 rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
            {sinStock ? (
              <div className="space-y-3">
                <p className="text-sm text-ink-600">Este producto no tiene stock en este momento. Consultanos y te avisamos cuando ingrese.</p>
                <a href={whatsappUrl(TIENDA.whatsapp, `Hola! Quisiera saber cuándo tienen stock de ${nombre} (código ${product.codigo}).`)} target="_blank" rel="noreferrer" className={buttonClasses({ variant: 'whatsapp', size: 'lg', className: 'w-full' })}>
                  <WhatsAppLogo className="h-5 w-5" /> Avisame cuando haya stock
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <QuantityStepper value={Math.min(cantidad, Math.max(maxCantidad, 1))} onChange={setCantidad} max={Math.max(maxCantidad, 1)} />
                  <Button size="lg" className="flex-1" disabled={maxCantidad <= 0} onClick={() => { agregar(product, Math.min(cantidad, maxCantidad)); setCantidad(1); }}>
                    <ShoppingBag className="h-5 w-5" /> Agregar al carrito
                  </Button>
                </div>
                {enCarrito > 0 && (
                  <p className="text-center text-sm text-ink-500">
                    Ya tenés {enCarrito} en tu carrito ·{' '}
                    <button type="button" onClick={() => dispatch(setShowCart(true))} className="cursor-pointer font-semibold text-brand-600 hover:underline">Ver carrito</button>
                  </p>
                )}
              </div>
            )}
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icono: Store, titulo: 'Retiro gratis', texto: 'En sucursal' },
              { icono: Truck, titulo: 'Delivery', texto: COSTO_DELIVERY ? formatCurrency(COSTO_DELIVERY) : 'Consultar' },
              { icono: ShieldCheck, titulo: 'Compra segura', texto: 'Producto original' },
            ].map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink-100">
                <Icono className="h-5 w-5 shrink-0 text-leaf-600" />
                <span className="text-sm leading-tight"><strong className="block text-ink-900">{titulo}</strong><span className="text-ink-500">{texto}</span></span>
              </li>
            ))}
          </ul>

          <p className="mt-6 rounded-2xl bg-sky-50 p-4 text-xs leading-relaxed text-sky-700">
            Ante cualquier duda, consulte a su médico o farmacéutico. Los medicamentos de venta bajo receta requieren la presentación de la misma al momento del retiro o la entrega.
          </p>
        </div>
      </div>

      {similares.length > 0 && (
        <div className="mt-20">
          <CarruselProductos titulo="También te puede interesar" productos={similares} />
        </div>
      )}
    </div>
  );
}
