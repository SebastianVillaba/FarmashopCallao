import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';

// IMPORTACIONES DE LAS IMAGENES
import image1 from '../assets/farmaShop/Banner-Farmashop-Delivery.jpg'
import image2 from '../assets/farmaShop/Banner-web-agua-de-hamamelis.jpg'
import image3 from '../assets/farmaShop/Banner-web-serum-pharmacare.jpg'

const BANNERS = [
  { src: image1, alt: 'Delivery Farmashop' },
  { src: image2, alt: 'Agua de hamamelis' },
  { src: image3, alt: 'Serum Pharmacare' },
];

const INTERVALO_MS = 6000;

export default function HomeImageSlider() {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true });
  const [actual, setActual] = useState(0);

  const onSelect = useCallback(() => embla && setActual(embla.selectedScrollSnap()), [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on('select', onSelect);
    const timer = setInterval(() => embla.scrollNext(), INTERVALO_MS);
    // Si el usuario interactúa, se pausa el autoplay
    embla.on('pointerDown', () => clearInterval(timer));
    return () => {
      clearInterval(timer);
      embla.off('select', onSelect);
    };
  }, [embla, onSelect]);

  const flecha = 'absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/90 text-ink-800 shadow-card opacity-0 transition group-hover:opacity-100 hover:bg-white sm:grid';

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-ink-100 shadow-card">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {BANNERS.map((b, i) => (
            <div key={b.alt} className="min-w-0 flex-[0_0_100%]">
              <img
                src={b.src}
                alt={b.alt}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="aspect-[2.4/1] w-full object-cover sm:aspect-[4.08/1]"
              />
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => embla?.scrollPrev()} className={cn(flecha, 'left-4')} aria-label="Banner anterior">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" onClick={() => embla?.scrollNext()} className={cn(flecha, 'right-4')} aria-label="Banner siguiente">
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {BANNERS.map((b, i) => (
          <button
            key={b.alt}
            type="button"
            onClick={() => embla?.scrollTo(i)}
            aria-label={`Ir al banner ${i + 1}`}
            className={cn('h-2 cursor-pointer rounded-full bg-white shadow transition-all', i === actual ? 'w-6' : 'w-2 opacity-60')}
          />
        ))}
      </div>
    </div>
  );
}
