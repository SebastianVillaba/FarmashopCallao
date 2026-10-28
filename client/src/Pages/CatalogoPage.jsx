import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import CustomPagination from '../Components/CustomPagination';
import SideCategorias from '../Components/SideCategorias';
import { GrillaProductos } from '../Components/TarjetaProducto';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import { Select } from '../ui/Field';
import { EmptyState } from '../ui/misc';
import { api } from '../lib/api';
import { capitalizar } from '../lib/texto';
import useCategorias, { buscarCategoria } from '../hooks/useCategorias';

const POR_PAGINA = 24;

const ORDENES = {
  relevancia: { label: 'Relevancia', fn: null },
  'precio-asc': { label: 'Menor precio', fn: (a, b) => a.precio - b.precio },
  'precio-desc': { label: 'Mayor precio', fn: (a, b) => b.precio - a.precio },
  nombre: { label: 'Nombre A-Z', fn: (a, b) => a.nombreMercaderia.localeCompare(b.nombreMercaderia, 'es') },
};

// Por defecto: primero los que tienen imagen y stock
const relevancia = (a, b) =>
  ((b.stockTotal > 0) - (a.stockTotal > 0)) || (!!b.imagen - !!a.imagen);

export default function CatalogoPage() {
  const [params, setParams] = useSearchParams();
  const { departamentos, cargando: cargandoCategorias } = useCategorias();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  const q = params.get('q')?.trim() || '';
  const idCategoria = params.get('categoria');
  const slugDepto = params.get('depto');
  const orden = ORDENES[params.get('orden')] ? params.get('orden') : 'relevancia';
  const pagina = Math.max(1, parseInt(params.get('page')) || 1);
  const labsActivos = params.getAll('lab');
  const soloStock = params.get('stock') !== '0';
  const precioMin = parseInt(params.get('min')) || null;
  const precioMax = parseInt(params.get('max')) || null;

  const infoCategoria = idCategoria ? buscarCategoria(departamentos, idCategoria) : null;
  const departamento = infoCategoria?.departamento || departamentos.find((d) => d.slug === slugDepto) || null;

  // Qué consultar al backend según la URL
  const consulta = useMemo(() => {
    if (q) return { url: '/productos/buscarProducto', params: { palabra: q } };
    if (idCategoria) return { url: '/productos/buscarProductoCategoria', params: { idCategoria } };
    if (slugDepto) {
      if (!departamento) return null; // esperando categorías
      return { url: '/productos/buscarProductoCategoria', params: { idCategoria: departamento.categorias.map((c) => c.id).join(',') } };
    }
    return { url: '/productos/destacados', params: { limit: 48 } };
  }, [q, idCategoria, slugDepto, departamento]);

  const claveConsulta = consulta ? `${consulta.url}?${new URLSearchParams(consulta.params)}` : null;

  useEffect(() => {
    if (!consulta) {
      if (!cargandoCategorias) {
        setProductos([]);
        setCargando(false);
      }
      return;
    }
    const controller = new AbortController();
    setCargando(true);
    setError(null);
    api.get(consulta.url, { params: consulta.params, signal: controller.signal })
      .then(({ data }) => setProductos(data.respuesta || []))
      .catch((err) => {
        if (err.name !== 'CanceledError') {
          setError(err);
          setProductos([]);
        }
      })
      .finally(() => !controller.signal.aborted && setCargando(false));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveConsulta, cargandoCategorias]);

  // Laboratorios presentes en los resultados, ordenados por cantidad
  const laboratorios = useMemo(() => {
    const conteo = new Map();
    productos.forEach((p) => p.nombreLab && conteo.set(p.nombreLab, (conteo.get(p.nombreLab) || 0) + 1));
    return [...conteo].map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
  }, [productos]);

  const rangoPrecio = useMemo(() => {
    if (!productos.length) return [0, 0];
    const precios = productos.map((p) => p.precio);
    return [Math.floor(Math.min(...precios) / 1000) * 1000, Math.ceil(Math.max(...precios) / 1000) * 1000];
  }, [productos]);

  const filtrados = useMemo(() => {
    const lista = productos.filter((p) =>
      (!soloStock || p.stockTotal === undefined || p.stockTotal > 0) &&
      (!labsActivos.length || labsActivos.includes(p.nombreLab)) &&
      (precioMin === null || p.precio >= precioMin) &&
      (precioMax === null || p.precio <= precioMax)
    );
    return lista.sort(ORDENES[orden].fn || relevancia);
  }, [productos, soloStock, labsActivos.join('|'), precioMin, precioMax, orden]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const actualizar = (cambios, { resetPagina = true } = {}) => {
    const nuevos = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => {
      nuevos.delete(k);
      if (Array.isArray(v)) v.forEach((x) => nuevos.append(k, x));
      else if (v !== null && v !== undefined && v !== '') nuevos.set(k, v);
    });
    if (resetPagina) nuevos.delete('page');
    setParams(nuevos);
  };

  const cambiarPagina = (p) => {
    actualizar({ page: p > 1 ? p : null }, { resetPagina: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLab = (lab) =>
    actualizar({ lab: labsActivos.includes(lab) ? labsActivos.filter((l) => l !== lab) : [...labsActivos, lab] });

  const limpiarFiltros = () => actualizar({ lab: [], min: null, max: null, stock: null });
  const hayFiltros = labsActivos.length > 0 || precioMin !== null || precioMax !== null || !soloStock;

  const titulo = q
    ? `Resultados para “${q}”`
    : infoCategoria ? infoCategoria.categoria.nombre
    : departamento ? departamento.nombre
    : slugDepto ? 'Categoría'
    : 'Productos destacados';

  const migas = [{ label: 'Catálogo', to: '/catalogo' }];
  if (departamento) migas.push({ label: departamento.nombre, to: `/catalogo?depto=${departamento.slug}` });
  if (infoCategoria) migas.push({ label: infoCategoria.categoria.nombre });
  if (q) migas.push({ label: `Búsqueda: ${q}` });

  const panelFiltros = (
    <SideCategorias
      categorias={departamento?.categorias}
      categoriaActiva={idCategoria}
      onCategoria={(id) => actualizar(id ? { categoria: id, depto: null, q: null, lab: [] } : { categoria: null, depto: departamento?.slug, lab: [] })}
      laboratorios={laboratorios}
      labsActivos={labsActivos}
      onToggleLab={toggleLab}
      rangoPrecio={rangoPrecio}
      precio={[precioMin ?? rangoPrecio[0], precioMax ?? rangoPrecio[1]]}
      onPrecio={([min, max]) => actualizar({ min: min > rangoPrecio[0] ? min : null, max: max < rangoPrecio[1] ? max : null })}
      soloStock={soloStock}
      onSoloStock={(v) => actualizar({ stock: v ? null : '0' })}
    />
  );

  return (
    <div className="container-page pt-6">
      <title>{`${titulo} · Farmashop`}</title>
      <CustomBreadcrumbs items={migas} />

      <div className="mt-5 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{titulo}</h1>
          {!cargando && (
            <p className="mt-1.5 text-ink-500">
              {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
              {filtrados.length !== productos.length && ` de ${productos.length}`}
            </p>
          )}
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <Button variant="outline" className="flex-1 lg:hidden" onClick={() => setFiltrosAbiertos(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Filtros
            {hayFiltros && <span className="h-2 w-2 rounded-full bg-brand-500" />}
          </Button>
          <Select aria-label="Ordenar por" value={orden} onChange={(e) => actualizar({ orden: e.target.value === 'relevancia' ? null : e.target.value })} className="flex-1 sm:w-52">
            {Object.entries(ORDENES).map(([k, o]) => <option key={k} value={k}>{o.label}</option>)}
          </Select>
        </div>
      </div>

      {hayFiltros && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {labsActivos.map((lab) => (
            <button key={lab} type="button" onClick={() => toggleLab(lab)} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-50 py-1.5 pr-2.5 pl-3.5 text-sm font-medium text-brand-700 hover:bg-brand-100">
              {capitalizar(lab)} <X className="h-3.5 w-3.5" />
            </button>
          ))}
          {(precioMin !== null || precioMax !== null) && (
            <button type="button" onClick={() => actualizar({ min: null, max: null })} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-50 py-1.5 pr-2.5 pl-3.5 text-sm font-medium text-brand-700 hover:bg-brand-100">
              Rango de precio <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!soloStock && (
            <button type="button" onClick={() => actualizar({ stock: null })} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-50 py-1.5 pr-2.5 pl-3.5 text-sm font-medium text-brand-700 hover:bg-brand-100">
              Incluye sin stock <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={limpiarFiltros} className="cursor-pointer px-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
            Limpiar todo
          </button>
        </div>
      )}

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-40 max-h-[calc(100vh-11rem)] overflow-y-auto rounded-3xl border border-ink-100 bg-white p-5 shadow-card">
            {panelFiltros}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {error ? (
            <EmptyState icon={PackageSearch} title="No pudimos cargar los productos" action={<Button onClick={() => window.location.reload()}>Reintentar</Button>}>
              Revisá tu conexión e intentá de nuevo.
            </EmptyState>
          ) : !cargando && visibles.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={productos.length ? 'Ningún producto coincide con los filtros' : 'No encontramos productos'}
              action={productos.length
                ? <Button onClick={limpiarFiltros}>Limpiar filtros</Button>
                : <Button onClick={() => setParams({})}>Ver destacados</Button>}
            >
              {q ? 'Probá con otra palabra, el nombre genérico o la marca.' : 'Probá con otra categoría.'}
            </EmptyState>
          ) : (
            <>
              <GrillaProductos productos={visibles} cargando={cargando} cantidadSkeleton={12} />
              <div className="mt-10">
                <CustomPagination page={Math.min(pagina, totalPaginas || 1)} count={totalPaginas} onChange={cambiarPagina} />
              </div>
            </>
          )}
        </div>
      </div>

      <Drawer
        open={filtrosAbiertos}
        onOpenChange={setFiltrosAbiertos}
        side="left"
        title="Filtros"
        className="max-w-sm"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={limpiarFiltros} disabled={!hayFiltros}>Limpiar</Button>
            <Button onClick={() => setFiltrosAbiertos(false)}>Ver {filtrados.length}</Button>
          </div>
        }
      >
        <div className="p-5">{panelFiltros}</div>
      </Drawer>
    </div>
  );
}
