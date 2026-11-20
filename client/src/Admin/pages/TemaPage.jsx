import { useEffect, useState } from 'react';
import { CalendarClock, Check, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Input, Select } from '../../ui/Field';
import { Card } from '../../ui/misc';
import { api, mensajeError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { LISTA_TEMAS, TEMAS } from '../../config/temas';
import { useConfig } from '../../context/ConfigContext';
import { Cargando, Encabezado, Toggle } from '../components/ui';

function TarjetaTema({ tema, elegido, onElegir }) {
  return (
    <button
      type="button"
      onClick={onElegir}
      aria-pressed={elegido}
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-3xl border-2 bg-white text-left transition',
        elegido ? 'border-ink-900 shadow-card-hover' : 'border-ink-100 hover:border-ink-300'
      )}
    >
      <div className="flex h-24" aria-hidden>
        {tema.colores.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}
      </div>
      <div className="p-4">
        <p className="font-bold text-ink-900">{tema.nombre}</p>
        <p className="mt-0.5 text-xs text-ink-500">{tema.descripcion}</p>
      </div>
      {elegido && (
        <span className="absolute top-3 right-3 grid h-7 w-7 place-items-center rounded-full bg-ink-900 text-white"><Check className="h-4 w-4" strokeWidth={3} /></span>
      )}
    </button>
  );
}

export default function TemaPage() {
  const { recargar } = useConfig();
  const [ajustes, setAjustes] = useState(null);
  const [programar, setProgramar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/admin/ajustes')
      .then(({ data }) => {
        const { tema, temaProgramado, ga4Id, temaVigente } = data.respuesta;
        setAjustes({
          tema,
          temaVigente,
          ga4Id: ga4Id || '',
          programado: temaProgramado || { tema: 'navidad', desde: '', hasta: '' },
        });
        setProgramar(Boolean(temaProgramado));
      })
      .catch((err) => toast.error(mensajeError(err)));
  }, []);

  if (!ajustes) return <Cargando />;

  const guardar = async () => {
    setGuardando(true);
    try {
      const { data } = await api.put('/admin/ajustes', {
        tema: ajustes.tema,
        temaProgramado: programar ? ajustes.programado : null,
        ga4Id: ajustes.ga4Id.trim() || null,
      });
      setAjustes((a) => ({ ...a, temaVigente: data.respuesta.temaVigente }));
      await recargar(); // el panel también cambia de temática al instante
      toast.success('Cambios aplicados en toda la web');
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const setProgramado = (campo, valor) => setAjustes((a) => ({ ...a, programado: { ...a.programado, [campo]: valor } }));
  const fechasIncompletas = programar && (!ajustes.programado.desde || !ajustes.programado.hasta);

  return (
    <>
      <Encabezado
        titulo="Temática de la web"
        descripcion="La temática es la misma para todos: se aplica en la tienda y en este panel, en cualquier computadora o celular, apenas se guarda."
      >
        <Button onClick={guardar} disabled={guardando || fechasIncompletas}>
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar y aplicar
        </Button>
      </Encabezado>

      <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-card ring-1 ring-ink-100">
        En este momento se ve: <strong className="text-brand-600">{(TEMAS[ajustes.temaVigente] || TEMAS.default).nombre}</strong>
      </p>

      <section>
        <h2 className="mb-3 text-lg font-bold">Temática fija</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {LISTA_TEMAS.map((t) => (
            <TarjetaTema key={t.id} tema={t} elegido={ajustes.tema === t.id} onElegir={() => setAjustes((a) => ({ ...a, tema: t.id }))} />
          ))}
        </div>
      </section>

      <Card className="mt-8 space-y-5 p-6">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 text-brand-500" />
          <div className="flex-1">
            <Toggle
              checked={programar}
              onChange={setProgramar}
              label="Programar una temática por fechas"
              descripcion="Entre esas fechas se usa la temática programada; antes y después vuelve sola a la temática fija."
            />
          </div>
        </div>
        {programar && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Temática" value={ajustes.programado.tema} onChange={(e) => setProgramado('tema', e.target.value)}>
              {LISTA_TEMAS.filter((t) => t.id !== 'default').map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </Select>
            <Input label="Desde" type="date" value={ajustes.programado.desde} onChange={(e) => setProgramado('desde', e.target.value)} required />
            <Input label="Hasta (inclusive)" type="date" value={ajustes.programado.hasta} min={ajustes.programado.desde} onChange={(e) => setProgramado('hasta', e.target.value)} required />
          </div>
        )}
      </Card>

      <Card className="mt-6 space-y-3 p-6">
        <h2 className="text-lg font-bold">Google Analytics 4</h2>
        <p className="text-sm text-ink-500">
          Opcional. Pegá el ID de medición (G-XXXXXXXXXX) para enviar también los datos a Google Analytics y medir campañas de Google y Meta.
          Las estadísticas de este panel funcionan igual sin GA4.
        </p>
        <Input className="max-w-xs" placeholder="G-XXXXXXXXXX" value={ajustes.ga4Id} onChange={(e) => setAjustes((a) => ({ ...a, ga4Id: e.target.value.toUpperCase() }))} />
      </Card>
    </>
  );
}
