import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Pencil, Plus, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Input, Select } from '../../ui/Field';
import { Card } from '../../ui/misc';
import { api, mensajeError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { LISTA_TEMAS, TEMAS } from '../../config/temas';
import { useConfig } from '../../context/ConfigContext';
import Modal from '../components/Modal';
import { Cargando, Encabezado, Toggle } from '../components/ui';

const UBICACIONES = {
  carrusel: { nombre: 'Carrusel principal', medida: 'Escritorio 2448 × 600 px (4,08:1). Móvil opcional 1080 × 1080 px.', varios: true },
  promo_1: { nombre: 'Promo izquierda (home)', medida: 'Recomendado 1200 × 560 px. Reemplaza a la tarjeta "Dermocosmética".', varios: false },
  promo_2: { nombre: 'Promo derecha (home)', medida: 'Recomendado 1200 × 560 px. Reemplaza a la tarjeta "Bebés".', varios: false },
};

const hoy = () => new Date().toISOString().slice(0, 10);

const estadoBanner = (b) => {
  if (!b.activo) return { texto: 'Inactivo', tono: 'bg-ink-100 text-ink-600' };
  if (b.desde && b.desde > hoy()) return { texto: `Desde ${b.desde}`, tono: 'bg-amber-50 text-amber-700' };
  if (b.hasta && b.hasta < hoy()) return { texto: 'Vencido', tono: 'bg-red-50 text-red-700' };
  if (b.tema) return { texto: `Sólo ${TEMAS[b.tema]?.nombre || b.tema}`, tono: 'bg-violet-50 text-violet-700' };
  return { texto: 'Publicado', tono: 'bg-leaf-50 text-leaf-700' };
};

function SelectorImagen({ label, actual, archivo, onArchivo, icono: Icono = ImagePlus, aspecto }) {
  const input = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!archivo) { setPreview(null); return undefined; }
    const url = URL.createObjectURL(archivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const src = preview || actual;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-700">{label}</p>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn('relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50 transition hover:border-brand-300', aspecto)}
      >
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : (
          <span className="flex flex-col items-center gap-1 text-xs text-ink-500"><Icono className="h-6 w-6" /> Elegir imagen</span>
        )}
      </button>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { onArchivo(e.target.files[0] || null); e.target.value = ''; }} />
    </div>
  );
}

function FormBanner({ banner, ubicacionInicial, onGuardado }) {
  const [datos, setDatos] = useState({
    ubicacion: banner?.ubicacion || ubicacionInicial,
    alt: banner?.alt || '',
    link: banner?.link || '',
    activo: banner?.activo ?? true,
    desde: banner?.desde || '',
    hasta: banner?.hasta || '',
    tema: banner?.tema || '',
  });
  const [imagen, setImagen] = useState(null);
  const [imagenMovil, setImagenMovil] = useState(null);
  const [quitarMovil, setQuitarMovil] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const set = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }));

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const form = new FormData();
      Object.entries(datos).forEach(([k, v]) => form.append(k, String(v ?? '')));
      if (imagen) form.append('imagen', imagen);
      if (imagenMovil) form.append('imagenMovil', imagenMovil);
      if (quitarMovil && !imagenMovil) form.append('quitarMovil', 'true');
      if (banner) await api.put(`/admin/banners/${banner.idBanner}`, form);
      else await api.post('/admin/banners', form);
      toast.success(banner ? 'Banner actualizado' : 'Banner publicado');
      onGuardado();
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo guardar el banner'));
    } finally {
      setGuardando(false);
    }
  };

  const esCarrusel = datos.ubicacion === 'carrusel';

  return (
    <form onSubmit={guardar} className="space-y-4 p-5">
      <Select label="Ubicación" value={datos.ubicacion} onChange={(e) => set('ubicacion')(e.target.value)}>
        {Object.entries(UBICACIONES).map(([id, u]) => <option key={id} value={id}>{u.nombre}</option>)}
      </Select>
      <p className="-mt-2 text-xs text-ink-500">{UBICACIONES[datos.ubicacion].medida}</p>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <SelectorImagen label="Imagen (escritorio)" actual={banner?.src} archivo={imagen} onArchivo={setImagen} aspecto={esCarrusel ? 'aspect-[4.08/1]' : 'aspect-[2.14/1]'} />
        <div>
          <SelectorImagen label="Móvil (opcional)" actual={quitarMovil ? null : banner?.srcMovil} archivo={imagenMovil} onArchivo={(f) => { setImagenMovil(f); setQuitarMovil(false); }} icono={Smartphone} aspecto="aspect-square" />
          {(banner?.srcMovil || imagenMovil) && !quitarMovil && (
            <button type="button" onClick={() => { setImagenMovil(null); setQuitarMovil(true); }} className="mt-1 cursor-pointer text-xs font-semibold text-red-600 hover:underline">Quitar versión móvil</button>
          )}
        </div>
      </div>

      <Input label="Descripción (texto alternativo)" value={datos.alt} onChange={(e) => set('alt')(e.target.value)} required maxLength={150} hint="Para accesibilidad y Google. Ej: 'Hasta 30% off en protectores solares'." />
      <Input label="Link al hacer clic (opcional)" value={datos.link} onChange={(e) => set('link')(e.target.value)} placeholder="/ofertas  ó  /catalogo?depto=bebes  ó  https://…" maxLength={300} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Desde (opcional)" type="date" value={datos.desde} onChange={(e) => set('desde')(e.target.value)} />
        <Input label="Hasta (opcional)" type="date" value={datos.hasta} min={datos.desde || undefined} onChange={(e) => set('hasta')(e.target.value)} />
        <Select label="Sólo con temática" value={datos.tema} onChange={(e) => set('tema')(e.target.value)}>
          <option value="">Siempre</option>
          {LISTA_TEMAS.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </Select>
      </div>

      <Toggle checked={datos.activo} onChange={set('activo')} label="Publicado" descripcion="Apagalo para guardarlo sin mostrarlo." />

      <Button type="submit" className="w-full" disabled={guardando || (!banner && !imagen) || datos.alt.trim().length < 2}>
        {guardando && <Loader2 className="h-4 w-4 animate-spin" />} {banner ? 'Guardar cambios' : 'Publicar banner'}
      </Button>
    </form>
  );
}

export default function BannersPage() {
  const { recargar } = useConfig();
  const [banners, setBanners] = useState(null);
  const [editor, setEditor] = useState(null); // { banner?, ubicacion }
  const [confirmar, setConfirmar] = useState(null);

  const cargar = useCallback(() =>
    api.get('/admin/banners').then(({ data }) => setBanners(data.respuesta)).catch((err) => toast.error(mensajeError(err))), []);

  useEffect(() => { cargar(); }, [cargar]);

  const despuesDeCambio = () => {
    cargar();
    recargar();
  };

  const mover = async (lista, indice, delta) => {
    const nueva = [...lista];
    const [b] = nueva.splice(indice, 1);
    nueva.splice(indice + delta, 0, b);
    setBanners((todos) => [...todos.filter((x) => x.ubicacion !== b.ubicacion), ...nueva]);
    try {
      await api.put('/admin/banners/orden', { ids: nueva.map((x) => x.idBanner) });
      recargar();
    } catch (err) {
      toast.error(mensajeError(err));
      cargar();
    }
  };

  const eliminar = async (b) => {
    try {
      await api.delete(`/admin/banners/${b.idBanner}`);
      toast.success('Banner eliminado');
      despuesDeCambio();
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setConfirmar(null);
    }
  };

  if (!banners) return <Cargando />;

  return (
    <>
      <Encabezado titulo="Banners" descripcion="Imágenes del carrusel y de los espacios promocionales de la home. Los cambios se ven en la tienda en menos de un minuto." />

      <div className="space-y-8">
        {Object.entries(UBICACIONES).map(([ubicacion, u]) => {
          const lista = banners.filter((b) => b.ubicacion === ubicacion);
          return (
            <section key={ubicacion}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{u.nombre}</h2>
                  <p className="text-xs text-ink-500">{u.medida}{u.varios ? '' : ' Se muestra el primero vigente.'}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditor({ ubicacion })}><Plus className="h-4 w-4" /> Agregar</Button>
              </div>

              {!lista.length ? (
                <Card className="p-6 text-center text-sm text-ink-500">
                  {ubicacion === 'carrusel' ? 'Sin banners cargados: la tienda muestra los banners originales.' : 'Sin banner: se muestra la tarjeta por defecto.'}
                </Card>
              ) : (
                <div className="space-y-3">
                  {lista.map((b, i) => {
                    const estado = estadoBanner(b);
                    return (
                      <Card key={b.idBanner} className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
                        <img src={b.src} alt={b.alt} className={cn('w-full rounded-2xl object-cover sm:w-72', ubicacion === 'carrusel' ? 'aspect-[4.08/1]' : 'aspect-[2.14/1]')} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink-900">{b.alt}</p>
                          <p className="truncate text-xs text-ink-500">{b.link || 'Sin link'}{b.srcMovil ? ' · con versión móvil' : ''}</p>
                          <span className={cn('mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', estado.tono)}>{estado.texto}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => mover(lista, i, -1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" disabled={i === lista.length - 1} onClick={() => mover(lista, i, 1)} aria-label="Bajar"><ArrowDown className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditor({ banner: b, ubicacion })} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                          {confirmar === b.idBanner ? (
                            <Button size="sm" className="bg-red-600 shadow-none hover:bg-red-700" onClick={() => eliminar(b)}>¿Eliminar?</Button>
                          ) : (
                            <Button size="icon" variant="ghost" className="hover:text-red-600" onClick={() => setConfirmar(b.idBanner)} aria-label="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <Modal open={Boolean(editor)} onOpenChange={(v) => !v && setEditor(null)} title={editor?.banner ? 'Editar banner' : 'Nuevo banner'} className="max-w-2xl">
        {editor && (
          <FormBanner
            key={editor.banner?.idBanner || 'nuevo'}
            banner={editor.banner}
            ubicacionInicial={editor.ubicacion}
            onGuardado={() => { setEditor(null); despuesDeCambio(); }}
          />
        )}
      </Modal>
    </>
  );
}
