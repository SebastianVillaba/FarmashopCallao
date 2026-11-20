import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import { useConfig } from '../context/ConfigContext';

// Banners por defecto (si todavía no se cargaron desde el panel)
import image1 from '../assets/farmaShop/Banner-Farmashop-Delivery.jpg'
import image2 from '../assets/farmaShop/Banner-web-agua-de-hamamelis.jpg'
import image3 from '../assets/farmaShop/Banner-web-serum-pharmacare.jpg'

const BANNERS_DEFECTO = [
  { id: 'd1', src: image1, alt: 'Delivery Farmashop' },
  { id: 'd2', src: image2, alt: 'Agua de hamamelis' },
  { id: 'd3', src: image3, alt: 'Serum Pharmacare' },
];

const INTERVALO_MS = 6000;

// Envuelve el banner en un link interno o externo si tiene uno
function EnlaceBanner({ link, children }) {
  if (!link) return children;
  if (link.startsWith('/')) return <Link to={link} className="block">{children}</Link>;
  return <a href={link} target="_blank" rel="noreferrer" className="block">{children}</a>;
}

export default function HomeImageSlider() {
  const { banners: config, cargado } = useConfig();
  const banners = config?.carrusel?.length ? config.carrusel : cargado ? BANNERS_DEFECTO : [];
  const [emblaRef, embla] = useEmblaCarousel({ loop: banners.length > 1 });
  const [actual, setActual] = useState(0);

  const onSelect = useCallback(() => embla && setActual(embla.selectedScrollSnap()), [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.reInit();
    embla.on('select', onSelect);
    const timer = setInterval(() => embla.scrollNext(), INTERVALO_MS);
    // Si el usuario interactúa, se pausa el autoplay
    embla.on('pointerDown', () => clearInterval(timer));
    return () => {
      clearInterval(timer);
      embla.off('select', onSelect);
    };
  }, [embla, onSelect, banners.length]);

  const flecha = 'absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-ink-800 shadow-card opacity-0 transition group-hover:opacity-100 hover:bg-white sm:grid';

  // Mientras llega la configuración se reserva el espacio para que la página no salte
  if (!banners.length) {
    return <div className="aspect-[2.4/1] w-full animate-pulse rounded-3xl bg-ink-100 sm:aspect-[4.08/1]" />;
  }

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-ink-100 shadow-card">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {banners.map((b, i) => (
            <div key={b.id} className="min-w-0 flex-[0_0_100%]">
              <EnlaceBanner link={b.link}>
                <picture>
                  {b.srcMovil && <source media="(max-width: 639px)" srcSet={b.srcMovil} />}
                  <img
                    src={b.src}
                    alt={b.alt}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : undefined}
                    className={cn('w-full object-cover sm:aspect-[4.08/1]', b.srcMovil ? 'aspect-square' : 'aspect-[2.4/1]')}
                  />
                </picture>
              </EnlaceBanner>
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button type="button" onClick={() => embla?.scrollPrev()} className={cn(flecha, 'left-4')} aria-label="Banner anterior">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => embla?.scrollNext()} className={cn(flecha, 'right-4')} aria-label="Banner siguiente">
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => embla?.scrollTo(i)}
                aria-label={`Ir al banner ${i + 1}`}
                className={cn('h-2 cursor-pointer rounded-full bg-white shadow transition-all', i === actual ? 'w-6' : 'w-2 opacity-60')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
