import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../lib/cn';
import isotipo from '../assets/farmaShop/cropped-Isotipo-Farmashop-32x32.png';

// Imagen de producto servida desde /imagenes con skeleton y placeholder de marca
export default function ProductImage({ src, alt, className, imgClassName, eager = false, sizes }) {
  const [estado, setEstado] = useState(src ? 'cargando' : 'error');
  const [srcPrevio, setSrcPrevio] = useState(src);

  // Reiniciar al cambiar de imagen (galería)
  if (src !== srcPrevio) {
    setSrcPrevio(src);
    setEstado(src ? 'cargando' : 'error');
  }

  return (
    <div className={cn('relative aspect-square overflow-hidden bg-white', className)}>
      {estado === 'cargando' && <div className="absolute inset-0 animate-pulse bg-ink-100" />}

      {estado === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-50 via-white to-sky-50">
          <img src={isotipo} alt="" className="h-8 w-8 opacity-40 grayscale" />
          <span className="flex items-center gap-1 text-[11px] font-medium text-ink-400">
            <ImageOff className="h-3 w-3" /> Sin imagen
          </span>
        </div>
      ) : (
        <img
          ref={(img) => {
            // Si la imagen ya estaba en caché, onLoad puede dispararse antes de React
            if (img?.complete && estado === 'cargando') setEstado(img.naturalWidth ? 'ok' : 'error');
          }}
          src={src}
          alt={alt}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setEstado('ok')}
          onError={() => setEstado('error')}
          className={cn(
            'h-full w-full object-contain p-[8%] transition duration-300',
            estado === 'ok' ? 'opacity-100' : 'opacity-0',
            imgClassName
          )}
        />
      )}
    </div>
  );
}
