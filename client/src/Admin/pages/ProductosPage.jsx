import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Eye, EyeOff, ImageOff, ImagePlus, Loader2, Save, Search, Star, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Input, Textarea } from '../../ui/Field';
import { Card, EmptyState } from '../../ui/misc';
import ProductImage from '../../Components/ProductImage';
import { api, mensajeError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { nombreProducto } from '../../lib/texto';
import { formatCurrency } from '../../utils/formatCurrency';
import useDebounce from '../../hooks/useDebounce';
import CapturaFoto from '../components/CapturaFoto';
import Modal from '../components/Modal';
import { Encabezado, Toggle } from '../components/ui';

const FILTROS = [
  { id: '', label: 'Búsqueda' },
  { id: 'sin_foto', label: 'Con stock sin foto' },
  { id: 'destacados', label: 'Destacados' },
  { id: 'precio_web', label: 'Con precio Farmashop' },
  { id: 'ocultos', label: 'Ocultos' },
];

const separador = new Intl.NumberFormat('es-PY');

// Campo de guaraníes: muestra 50.000 y guarda 50000 (o null si está vacío)
function InputGs({ value, onChange, ...props }) {
  return (
    <Input
      inputMode="numeric"
      placeholder="Sin definir"
      value={value == null ? '' : separador.format(value)}
      onChange={(e) => {
        const digitos = e.target.value.replace(/\D/g, '').slice(0, 10);
        onChange(digitos ? Number(digitos) : null);
      }}
      {...props}
    />
  );
}

function FilaProducto({ p, activo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2.5 text-left transition',
        activo ? 'bg-brand-50 ring-2 ring-brand-300' : 'hover:bg-ink-50'
      )}
    >
      <ProductImage src={p.imagenes[0]?.url} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-ink-100" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold text-ink-900">{nombreProducto(p.nombre)}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
          <span>Cód. {p.codigo}</span>
          <span className={p.stock > 0 ? 'text-leaf-700' : 'text-red-600'}>Stock {p.stock}</span>
          <span className="font-semibold text-ink-700">{formatCurrency(p.precioPublicado)}</span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {p.destacado && <Star className="h-4 w-4 text-amber-500" fill="currentColor" aria-label="Destacado" />}
        {!p.visible && <EyeOff className="h-4 w-4 text-ink-400" aria-label="Oculto" />}
        {!p.imagenes.length && <ImageOff className="h-4 w-4 text-red-400" aria-label="Sin foto" />}
      </span>
    </button>
  );
}

// Vista previa de cómo se verá el precio en la tienda
function PreviewPrecio({ precioRecomendado, precioFarmashop, precioErp }) {
  const precio = precioFarmashop || precioErp;
  const tachado = precioRecomendado || (precioFarmashop && precioErp > precioFarmashop ? precioErp : null);
  const descuento = tachado > precio ? Math.round((1 - precio / tachado) * 100) : 0;
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
      <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Así se ve en la tienda</p>
      <div className="mt-3">
        {precioFarmashop && (
          <span className="inline-block rounded-full bg-brand-500 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase">Precio Farmashop</span>
        )}
        {descuento > 0 && (
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-400">
            {precioFarmashop && <span>Precio sugerido</span>}
            <span className="line-through">{formatCurrency(tachado)}</span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">-{descuento}%</span>
          </p>
        )}
        <p className={cn('font-display text-3xl font-extrabold', descuento > 0 ? 'text-brand-600' : 'text-ink-900')}>{formatCurrency(precio)}</p>
      </div>
    </div>
  );
}

function Galeria({ producto, onCambio }) {
  const [camara, setCamara] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const input = useRef(null);

  const subir = async (archivos) => {
    const lista = [...archivos].filter((f) => f.type.startsWith('image/'));
    if (!lista.length) return false;
    setSubiendo(true);
    try {
      const form = new FormData();
      lista.forEach((f) => form.append('imagenes', f));
      const { data } = await api.post(`/admin/productos/${producto.idProducto}/imagenes`, form);
      onCambio(data.respuesta);
      toast.success(lista.length > 1 ? `${lista.length} fotos agregadas` : 'Foto agregada');
      return true;
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo subir la imagen'));
      return false;
    } finally {
      setSubiendo(false);
    }
  };

  const principal = async (archivo) => {
    try {
      const { data } = await api.put(`/admin/productos/${producto.idProducto}/imagenes/principal`, { archivo });
      onCambio(data.respuesta);
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const borrar = async (archivo) => {
    try {
      const { data } = await api.delete(`/admin/productos/${producto.idProducto}/imagenes/${encodeURIComponent(archivo)}`);
      onCambio(data.respuesta);
      toast.success('Foto eliminada');
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setConfirmarBorrar(null);
    }
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">Fotos</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => input.current?.click()} disabled={subiendo}>
            <Upload className="h-4 w-4" /> Subir archivos
          </Button>
          <Button size="sm" onClick={() => setCamara(true)}>
            <Camera className="h-4 w-4" /> Sacar foto
          </Button>
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { subir(e.target.files); e.target.value = ''; }} />
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files); }}
        className={cn('grid grid-cols-3 gap-3 rounded-2xl transition sm:grid-cols-4', arrastrando && 'bg-brand-50 ring-2 ring-brand-300')}
      >
        {producto.imagenes.map((img, i) => (
          <div key={img.archivo} className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <ProductImage src={img.url} alt="" />
            {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-ink-900/80 px-2 py-0.5 text-[10px] font-bold text-white">Principal</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              {i > 0 && (
                <button type="button" onClick={() => principal(img.archivo)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white text-ink-700 hover:text-amber-500" aria-label="Usar como principal" title="Usar como principal">
                  <Star className="h-4 w-4" />
                </button>
              )}
              {confirmarBorrar === img.archivo ? (
                <button type="button" onClick={() => borrar(img.archivo)} className="h-8 cursor-pointer rounded-full bg-red-600 px-3 text-xs font-bold text-white">¿Borrar?</button>
              ) : (
                <button type="button" onClick={() => setConfirmarBorrar(img.archivo)} className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white text-ink-700 hover:text-red-600" aria-label="Eliminar foto" title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ink-200 text-xs font-medium text-ink-500 transition hover:border-brand-300 hover:text-brand-600"
        >
          {subiendo ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          {subiendo ? 'Subiendo…' : 'Arrastrá o elegí'}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-500">Se guardan en WebP de 1200 px con fondo blanco. La primera es la que se ve en el catálogo.</p>

      <Modal open={camara} onOpenChange={setCamara} title="Sacar foto del producto" className="max-w-xl">
        {camara && <CapturaFoto enviando={subiendo} onCaptura={(archivo) => subir([archivo])} />}
      </Modal>
    </section>
  );
}

function FichaProducto({ idProducto, onGuardado }) {
  const [producto, setProducto] = useState(null);
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setProducto(null);
    api.get(`/admin/productos/${idProducto}`)
      .then(({ data }) => {
        setProducto(data.respuesta);
        const { descripcionWeb, visible, destacado, precioRecomendado, precioFarmashop } = data.respuesta;
        setForm({ descripcionWeb, visible, destacado, precioRecomendado, precioFarmashop });
      })
      .catch((err) => toast.error(mensajeError(err, 'No se pudo cargar el producto')));
  }, [idProducto]);

  if (!producto || !form) {
    return <Card className="grid min-h-96 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></Card>;
  }

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const errorPrecio = form.precioFarmashop && form.precioRecomendado && form.precioFarmashop >= form.precioRecomendado
    ? 'Tiene que ser menor que el precio recomendado'
    : null;

  const guardar = async () => {
    setGuardando(true);
    try {
      const { data } = await api.put(`/admin/productos/${idProducto}`, form);
      setProducto(data.respuesta);
      onGuardado(data.respuesta);
      toast.success('Producto actualizado');
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo guardar'));
    } finally {
      setGuardando(false);
    }
  };

  const actualizarImagenes = (imagenes) => {
    const actualizado = { ...producto, imagenes };
    setProducto(actualizado);
    onGuardado(actualizado);
  };

  return (
    <Card className="space-y-8 p-5 sm:p-7">
      <div>
        <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">{producto.laboratorio}</p>
        <h2 className="mt-1 text-xl font-extrabold">{nombreProducto(producto.nombre)}</h2>
        <p className="mt-1 text-sm text-ink-500">
          Código {producto.codigo}{producto.codigoBarra ? ` · EAN ${producto.codigoBarra}` : ''} · Stock {producto.stock} · Precio ERP {formatCurrency(producto.precioErp)}
        </p>
      </div>

      <Galeria producto={producto} onCambio={actualizarImagenes} />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-bold">Precios web</h3>
          <InputGs
            label="Precio recomendado (tachado)"
            hint="Precio sugerido de referencia. Se muestra tachado."
            value={form.precioRecomendado}
            onChange={set('precioRecomendado')}
          />
          <InputGs
            label="Precio Farmashop (se cobra)"
            hint={`Si queda vacío se usa el precio del ERP (${formatCurrency(producto.precioErp)}).`}
            value={form.precioFarmashop}
            onChange={set('precioFarmashop')}
            error={errorPrecio}
          />
        </div>
        <PreviewPrecio precioRecomendado={form.precioRecomendado} precioFarmashop={form.precioFarmashop} precioErp={producto.precioErp} />
      </section>

      <section className="space-y-4">
        <h3 className="font-bold">Publicación</h3>
        <Toggle checked={form.visible} onChange={set('visible')} label="Visible en la tienda" descripcion="Si se apaga, el producto no aparece ni se puede comprar en la web." />
        <Toggle checked={form.destacado} onChange={set('destacado')} label="Destacado en la home" descripcion="Aparece primero en la sección de productos destacados (si tiene stock)." />
        <Textarea
          label="Descripción web"
          rows={6}
          maxLength={8000}
          placeholder="Para qué sirve, modo de uso, presentación, advertencias…"
          value={form.descripcionWeb || ''}
          onChange={(e) => set('descripcionWeb')(e.target.value)}
        />
      </section>

      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between gap-3 border-t border-ink-100 bg-white/95 p-4 backdrop-blur sm:-mx-7 sm:-mb-7 sm:px-7">
        <span className="flex items-center gap-1.5 text-xs text-ink-500">
          {form.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {form.visible ? 'Visible' : 'Oculto'}
        </span>
        <Button onClick={guardar} disabled={guardando || Boolean(errorPrecio)}>
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar cambios
        </Button>
      </div>
    </Card>
  );
}

export default function ProductosPage() {
  const [params, setParams] = useSearchParams();
  const [termino, setTermino] = useState(params.get('q') || '');
  const filtro = params.get('filtro') || '';
  const seleccionado = Number(params.get('id')) || null;
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const q = useDebounce(termino.trim(), 350);

  useEffect(() => {
    if (!filtro && q.length < 2) {
      setResultados([]);
      return;
    }
    const controller = new AbortController();
    setCargando(true);
    api.get('/admin/productos', { params: { q: q || undefined, filtro: filtro || undefined }, signal: controller.signal })
      .then(({ data }) => setResultados(data.respuesta))
      .catch((err) => err.name !== 'CanceledError' && toast.error(mensajeError(err)))
      .finally(() => !controller.signal.aborted && setCargando(false));
    return () => controller.abort();
  }, [q, filtro]);

  const cambiarParams = (cambios) => {
    const p = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  // Mantiene la lista sincronizada con lo guardado en la ficha
  const alGuardar = (p) => setResultados((lista) => lista.map((r) => (r.idProducto === p.idProducto ? { ...r, ...p } : r)));

  return (
    <>
      <Encabezado
        titulo="Productos"
        descripcion="Buscá un producto del ERP para cargarle fotos, descripción, precios web y visibilidad. El alta de productos se sigue haciendo en el ERP."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="flex flex-col p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={termino}
              onChange={(e) => setTermino(e.target.value)}
              placeholder="Nombre, código o código de barras"
              aria-label="Buscar producto"
              autoFocus
              className="h-12 w-full rounded-xl border border-ink-200 bg-white pr-4 pl-10 text-[15px] focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => cambiarParams({ filtro: f.id })}
                className={cn(
                  'shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  filtro === f.id ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="mt-3 -mx-1 flex-1 space-y-1 overflow-y-auto px-1">
            {cargando && <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>}
            {!cargando && resultados.map((p) => (
              <FilaProducto key={p.idProducto} p={p} activo={p.idProducto === seleccionado} onClick={() => cambiarParams({ id: String(p.idProducto) })} />
            ))}
            {!cargando && !resultados.length && (
              <p className="px-3 py-10 text-center text-sm text-ink-500">
                {filtro || q.length >= 2 ? 'No hay productos para mostrar.' : 'Escribí al menos 2 letras o elegí un filtro.'}
              </p>
            )}
          </div>
        </Card>

        <div>
          {seleccionado ? (
            <FichaProducto key={seleccionado} idProducto={seleccionado} onGuardado={alGuardar} />
          ) : (
            <Card>
              <EmptyState icon={Camera} title="Elegí un producto">
                Buscalo por nombre, código o escaneá el código de barras con el lector.
              </EmptyState>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
