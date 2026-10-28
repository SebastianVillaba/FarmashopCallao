import { useState } from 'react';
import { Clock, MapPin, Navigation } from 'lucide-react';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import { Card } from '../ui/misc';
import { cn } from '../lib/cn';
import { SUCURSALES } from '../config/tienda';

export default function SucursalesPage() {
  const [actual, setActual] = useState(SUCURSALES[0]);

  return (
    <div className="container-page pt-6">
      <title>Sucursales · Farmashop</title>
      <CustomBreadcrumbs items={[{ label: 'Sucursales' }]} />
      <h1 className="mt-5 mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Nuestras sucursales</h1>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <ul className="space-y-3">
          {SUCURSALES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setActual(s)}
                className={cn(
                  'w-full cursor-pointer rounded-3xl border-2 bg-white p-5 text-left transition',
                  actual.id === s.id ? 'border-brand-500 shadow-card' : 'border-ink-100 hover:border-ink-200'
                )}
              >
                <p className="font-display font-bold text-ink-900">{s.nombre}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-ink-600"><MapPin className="h-4 w-4 text-brand-500" /> {s.direccion}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-600"><Clock className="h-4 w-4 text-brand-500" /> {s.horario}</p>
              </button>
            </li>
          ))}
        </ul>

        <Card className="overflow-hidden">
          <iframe
            title={`Mapa de ${actual.nombre}`}
            src={`https://maps.google.com/maps?q=${actual.coords.lat},${actual.coords.lng}&z=16&output=embed`}
            className="h-[420px] w-full border-0 lg:h-full lg:min-h-[480px]"
            loading="lazy"
          />
          <div className="flex items-center justify-between gap-3 border-t border-ink-100 p-4">
            <p className="font-semibold">{actual.nombre}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${actual.coords.lat},${actual.coords.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
            >
              <Navigation className="h-4 w-4" /> Cómo llegar
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
