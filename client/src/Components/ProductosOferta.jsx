import { useEffect, useState } from 'react';
import { BadgePercent } from 'lucide-react';
import { CarruselProductos } from './ProductosDestacados';
import { api } from '../lib/api';

// Ofertas vigentes del ERP; la sección no se muestra si no hay ninguna
export default function ProductosOferta() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/productos/ofertas', { params: { limit: 15 } })
      .then(({ data }) => setProductos(data.respuesta || []))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  }, []);

  if (!cargando && !productos.length) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-sky-50 px-4 py-6 ring-1 ring-brand-100 sm:px-8 sm:py-8">
      <span className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand-100/60" />
      <div className="relative">
        <CarruselProductos
          titulo={
            <span className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-white shadow-sm shadow-brand-500/30">
                <BadgePercent className="h-5.5 w-5.5" />
              </span>
              Ofertas imperdibles
            </span>
          }
          subtitulo="Precios especiales por tiempo limitado"
          verTodo="/ofertas"
          productos={productos}
          cargando={cargando}
        />
      </div>
    </div>
  );
}
