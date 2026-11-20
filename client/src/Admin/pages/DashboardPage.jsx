import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ImageOff, Minus, SearchX, ShoppingCart, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../../ui/misc';
import { api, mensajeError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { nombreProducto } from '../../lib/texto';
import { formatCurrency } from '../../utils/formatCurrency';
import { Cargando, ESTADOS_PEDIDO, Encabezado } from '../components/ui';

const RANGOS = [
  { id: '7', label: '7 días' },
  { id: '30', label: '30 días' },
  { id: '90', label: '90 días' },
  { id: 'mes', label: 'Este mes' },
];

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const calcularRango = (id) => {
  const hoy = new Date();
  if (id === 'mes') return { desde: iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: iso(hoy) };
  const desde = new Date(hoy);
  desde.setDate(hoy.getDate() - (Number(id) - 1));
  return { desde: iso(desde), hasta: iso(hoy) };
};

const numero = new Intl.NumberFormat('es-PY');
const compacto = new Intl.NumberFormat('es-PY', { notation: 'compact', maximumFractionDigits: 1 });
const pct = (v, dec = 1) => `${(v * 100).toLocaleString('es-PY', { maximumFractionDigits: dec })}%`;
const diaCorto = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });

const FUENTES = { directo: 'Directo', google: 'Google', facebook: 'Facebook', instagram: 'Instagram', whatsapp: 'WhatsApp', tiktok: 'TikTok', bing: 'Bing' };
const nombreFuente = (f) => FUENTES[f] || f;
const MEDIOS = { organico: 'orgánico', cpc: 'pago (CPC)', social: 'redes', referido: 'referido' };
const PAGOS = { transferencia: 'Transferencia', qr: 'QR', contra_entrega: 'Contra entrega', retiro: 'Retiro en sucursal', delivery: 'Delivery' };
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ---------- Piezas ----------

function Variacion({ actual, anterior, invertir = false }) {
  if (!anterior) return <span className="text-xs text-ink-400">sin período anterior</span>;
  const cambio = (actual - anterior) / anterior;
  const sube = cambio > 0.005;
  const baja = cambio < -0.005;
  const bueno = invertir ? baja : sube;
  const Icono = sube ? ArrowUpRight : baja ? ArrowDownRight : Minus;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold', !sube && !baja ? 'text-ink-500' : bueno ? 'text-leaf-700' : 'text-red-600')}>
      <Icono className="h-3.5 w-3.5" aria-hidden /> {sube ? '+' : ''}{pct(cambio, 0)}
      <span className="font-normal text-ink-400">&nbsp;vs. período anterior</span>
    </span>
  );
}

function Kpi({ titulo, valor, detalle, actual, anterior, invertir }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-ink-500">{titulo}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink-900 tabular-nums sm:text-3xl">{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-ink-500">{detalle}</p>}
      <div className="mt-2"><Variacion actual={actual} anterior={anterior} invertir={invertir} /></div>
    </Card>
  );
}

function Seccion({ titulo, descripcion, children, className, accion }) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-xs text-ink-500">{descripcion}</p>}
        </div>
        {accion}
      </div>
      {children}
    </Card>
  );
}

function TooltipSerie({ active, payload, label, formato }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-3 py-2 text-xs shadow-pop">
      <p className="font-semibold text-ink-900">{diaCorto(label)}</p>
      <p className="mt-0.5 text-ink-600 tabular-nums">{formato(payload[0].value)}</p>
    </div>
  );
}

// Una sola serie por gráfico (ventas y visitas tienen escalas distintas: nunca doble eje)
function GraficoSerie({ datos, campo, formato, formatoEje, color = 'var(--color-brand-500)' }) {
  const id = `g-${campo}`;
  return (
    <div className="h-56" role="img" aria-label={`Evolución diaria de ${campo}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-ink-100)" />
          <XAxis dataKey="dia" tickFormatter={diaCorto} tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tickFormatter={formatoEje} tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }} axisLine={false} tickLine={false} width={48} allowDecimals={false} />
          <Tooltip content={<TooltipSerie formato={formato} />} cursor={{ stroke: 'var(--color-ink-300)', strokeDasharray: '3 3' }} />
          <Area type="monotone" dataKey={campo} stroke={color} strokeWidth={2} fill={`url(#${id})`} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Barra horizontal fina (un solo tono) dentro de tablas y del embudo
function Barra({ valor, maximo, className }) {
  const ancho = maximo > 0 ? Math.max(2, (valor / maximo) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-ink-100">
      <div className={cn('h-2 rounded-full bg-brand-500', className)} style={{ width: `${ancho}%` }} />
    </div>
  );
}

function Embudo({ pasos }) {
  const inicio = pasos[0]?.valor || 0;
  return (
    <ol className="space-y-3">
      {pasos.map((p, i) => {
        const previo = i > 0 ? pasos[i - 1].valor : null;
        return (
          <li key={p.paso} title={`${p.paso}: ${numero.format(p.valor)}`}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-ink-700">{p.paso}</span>
              <span className="tabular-nums">
                <strong className="text-ink-900">{numero.format(p.valor)}</strong>
                <span className="ml-2 text-xs text-ink-500">
                  {inicio ? pct(p.valor / inicio) : '—'}
                  {previo ? ` · ${pct(p.valor / previo, 0)} del paso anterior` : ''}
                </span>
              </span>
            </div>
            <Barra valor={p.valor} maximo={inicio} />
          </li>
        );
      })}
    </ol>
  );
}

function MapaHoras({ celdas }) {
  const mapa = new Map(celdas.map((c) => [`${c.diaSemana}-${c.hora}`, c]));
  const max = Math.max(1, ...celdas.map((c) => c.pedidos));
  const horas = Array.from({ length: 24 }, (_, h) => h);
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[560px] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[2px] text-[10px] text-ink-500">
        <span />
        {horas.map((h) => <span key={h} className="text-center">{h % 3 === 0 ? h : ''}</span>)}
        {DIAS.map((d, i) => (
          <div key={d} className="contents">
            <span className="self-center pr-1 text-right font-medium">{d}</span>
            {horas.map((h) => {
              const c = mapa.get(`${i + 1}-${h}`);
              const n = c?.pedidos || 0;
              return (
                <span
                  key={h}
                  title={`${d} ${h}:00 — ${n} pedido${n === 1 ? '' : 's'}${c ? ` · ${formatCurrency(c.ventas)}` : ''}`}
                  className="aspect-square rounded-[3px]"
                  style={{ background: n ? `color-mix(in oklab, var(--color-brand-600) ${15 + (n / max) * 85}%, white)` : 'var(--color-ink-100)' }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-2 text-[11px] text-ink-500">
        Menos <span className="h-2.5 w-16 rounded-full" style={{ background: 'linear-gradient(90deg, color-mix(in oklab, var(--color-brand-600) 15%, white), var(--color-brand-600))' }} /> Más pedidos
      </p>
    </div>
  );
}

function TablaSimple({ filas, columnas, vacio = 'Sin datos en el período.' }) {
  if (!filas.length) return <p className="py-6 text-center text-sm text-ink-500">{vacio}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-ink-500">
          <tr>{columnas.map((c) => <th key={c.titulo} className={cn('pb-2 font-semibold', c.derecha && 'text-right')}>{c.titulo}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {filas.map((f, i) => (
            <tr key={i}>
              {columnas.map((c) => <td key={c.titulo} className={cn('py-2 pr-3 align-middle', c.derecha && 'text-right tabular-nums', c.clase)}>{c.valor(f)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DistribucionPedidos({ filas, etiqueta = (k) => k }) {
  const max = Math.max(0, ...filas.map((f) => f.pedidos));
  if (!filas.length) return <p className="py-4 text-center text-sm text-ink-500">Sin datos.</p>;
  return (
    <ul className="space-y-2.5">
      {filas.map((f) => (
        <li key={f.clave}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink-700">{etiqueta(f.clave)}</span>
            <span className="tabular-nums text-ink-900">{f.pedidos}{f.ventas != null && <span className="ml-2 text-xs text-ink-500">{formatCurrency(f.ventas)}</span>}</span>
          </div>
          <Barra valor={f.pedidos} maximo={max} />
        </li>
      ))}
    </ul>
  );
}

// ---------- Página ----------

export default function DashboardPage() {
  const [rangoId, setRangoId] = useState('30');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [verTabla, setVerTabla] = useState(false);

  useEffect(() => {
    setCargando(true);
    api.get('/admin/stats', { params: calcularRango(rangoId) })
      .then(({ data }) => setDatos(data.respuesta))
      .catch((err) => toast.error(mensajeError(err, 'No se pudieron cargar las estadísticas')))
      .finally(() => setCargando(false));
  }, [rangoId]);

  const maxFuente = useMemo(() => Math.max(0, ...(datos?.fuentes || []).map((f) => f.sesiones)), [datos]);

  const filtros = (
    <div className="inline-flex rounded-full bg-white p-1 shadow-card ring-1 ring-ink-100" role="group" aria-label="Período">
      {RANGOS.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => setRangoId(r.id)}
          aria-pressed={rangoId === r.id}
          className={cn('cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold transition', rangoId === r.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:text-ink-900')}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  if (!datos) {
    return <><Encabezado titulo="Estadísticas">{filtros}</Encabezado><Cargando /></>;
  }

  const { actual: a, anterior: b } = datos.resumen;
  const ca = datos.carritosAbandonados;

  return (
    <div className={cn('transition-opacity', cargando && 'pointer-events-none opacity-60')}>
      <Encabezado titulo="Estadísticas" descripcion={`Del ${diaCorto(datos.rango.desde)} al ${diaCorto(datos.rango.hasta)}. Se comparan con los ${datos.rango.dias} días anteriores.`}>
        {filtros}
      </Encabezado>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi titulo="Ventas web" valor={formatCurrency(a.ventas)} detalle={`${a.pedidos} pedidos · ticket ${formatCurrency(a.ticketPromedio)}`} actual={a.ventas} anterior={b.ventas} />
        <Kpi titulo="Ventas finalizadas" valor={formatCurrency(a.ventasFinalizadas)} detalle={`${a.finalizados} pedidos entregados`} actual={a.ventasFinalizadas} anterior={b.ventasFinalizadas} />
        <Kpi titulo="Visitas" valor={numero.format(a.sesiones)} detalle={`${numero.format(a.visitantes)} personas distintas`} actual={a.sesiones} anterior={b.sesiones} />
        <Kpi
          titulo="Conversión"
          valor={pct(a.conversion, 2)}
          detalle={`Visitas que compraron · finalizadas ${pct(a.conversionFinalizada, 2)}`}
          actual={a.conversion}
          anterior={b.conversion}
        />
      </div>

      {/* Evolución */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Seccion
          titulo="Ventas por día"
          descripcion="Total de pedidos no cancelados (Gs.)"
          accion={(
            <button type="button" onClick={() => setVerTabla((v) => !v)} className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900" aria-pressed={verTabla}>
              <Table2 className="h-4 w-4" /> {verTabla ? 'Ver gráfico' : 'Ver tabla'}
            </button>
          )}
        >
          {verTabla ? (
            <div className="max-h-56 overflow-y-auto">
              <TablaSimple
                filas={[...datos.serie].reverse()}
                columnas={[
                  { titulo: 'Día', valor: (f) => diaCorto(f.dia) },
                  { titulo: 'Pedidos', derecha: true, valor: (f) => f.pedidos },
                  { titulo: 'Ventas', derecha: true, valor: (f) => formatCurrency(f.ventas) },
                  { titulo: 'Visitas', derecha: true, valor: (f) => numero.format(f.sesiones) },
                ]}
              />
            </div>
          ) : (
            <GraficoSerie datos={datos.serie} campo="ventas" formato={formatCurrency} formatoEje={(v) => compacto.format(v)} />
          )}
        </Seccion>
        <Seccion titulo="Visitas por día" descripcion="Sesiones (una persona puede visitar varias veces)">
          <GraficoSerie datos={datos.serie} campo="sesiones" formato={(v) => `${numero.format(v)} visitas`} formatoEje={(v) => compacto.format(v)} color="var(--color-sky-600)" />
        </Seccion>
      </div>

      {/* Embudo + abandono */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Seccion titulo="Embudo de compra" descripcion="Balance entre las personas que entran y las que terminan comprando">
          <Embudo pasos={datos.embudo} />
        </Seccion>
        <Seccion titulo="Carritos abandonados" descripcion="Visitas que agregaron productos y no compraron">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><ShoppingCart className="h-6 w-6" /></span>
            <div>
              <p className="font-display text-3xl font-extrabold tabular-nums">{pct(ca.tasa, 0)}</p>
              <p className="text-xs text-ink-500">{ca.abandonados} de {ca.conCarrito} carritos</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-600">
            Valor que quedó en carritos sin comprar: <strong className="text-ink-900">{formatCurrency(ca.valorAbandonado)}</strong>
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4 text-sm">
            <div>
              <p className="text-xs text-ink-500">Clientes nuevos</p>
              <p className="font-bold tabular-nums">{a.clientesNuevos} <span className="text-xs font-normal text-ink-500">de {a.pedidos} pedidos</span></p>
            </div>
            <div>
              <p className="text-xs text-ink-500">Tiempo promedio a entrega</p>
              <p className="font-bold tabular-nums">{datos.operacion.horasAEntrega != null ? `${datos.operacion.horasAEntrega.toLocaleString('es-PY', { maximumFractionDigits: 1 })} h` : '—'}</p>
            </div>
          </div>
        </Seccion>
      </div>

      {/* Origen del tráfico */}
      <Seccion className="mt-6" titulo="¿De dónde vienen los clientes?" descripcion="Fuente según UTM, anuncios (gclid/fbclid) o sitio de referencia">
        <TablaSimple
          filas={datos.fuentes}
          columnas={[
            { titulo: 'Fuente', valor: (f) => <span className="font-medium text-ink-900">{nombreFuente(f.fuente)}{f.medio && <span className="ml-1.5 text-xs font-normal text-ink-500">{MEDIOS[f.medio] || f.medio}</span>}</span> },
            { titulo: 'Visitas', clase: 'w-2/5', valor: (f) => (
              <div className="flex items-center gap-3"><span className="w-12 shrink-0 text-right tabular-nums">{numero.format(f.sesiones)}</span><Barra valor={f.sesiones} maximo={maxFuente} /></div>
            ) },
            { titulo: 'Pedidos', derecha: true, valor: (f) => f.pedidos },
            { titulo: 'Conversión', derecha: true, valor: (f) => (f.sesiones ? pct(f.pedidos / f.sesiones, 2) : '—') },
            { titulo: 'Ventas', derecha: true, valor: (f) => formatCurrency(f.ventas) },
          ]}
          vacio="Todavía no hay visitas registradas en este período."
        />
        {datos.campanias.length > 0 && (
          <div className="mt-6 border-t border-ink-100 pt-4">
            <h3 className="mb-2 text-sm font-bold">Campañas (utm_campaign)</h3>
            <TablaSimple
              filas={datos.campanias}
              columnas={[
                { titulo: 'Campaña', valor: (f) => <span className="font-medium">{f.campania}</span> },
                { titulo: 'Fuente', valor: (f) => nombreFuente(f.fuente) },
                { titulo: 'Visitas', derecha: true, valor: (f) => numero.format(f.sesiones) },
                { titulo: 'Pedidos', derecha: true, valor: (f) => f.pedidos },
                { titulo: 'Ventas', derecha: true, valor: (f) => formatCurrency(f.ventas) },
              ]}
            />
          </div>
        )}
      </Seccion>

      {/* Productos */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Seccion titulo="Productos más vendidos" descripcion="Por facturación en el período">
          <TablaSimple
            filas={datos.productos.masVendidos}
            columnas={[
              { titulo: 'Producto', valor: (f) => <Link to={`/admin/productos?id=${f.idProducto}`} className="line-clamp-1 font-medium text-ink-900 hover:text-brand-600">{nombreProducto(f.nombre)}</Link> },
              { titulo: 'Unid.', derecha: true, valor: (f) => f.unidades },
              { titulo: 'Ventas', derecha: true, valor: (f) => formatCurrency(f.ventas) },
            ]}
          />
        </Seccion>
        <Seccion titulo="Muy vistos, sin ventas" descripcion="Interesan pero no se compran: revisá precio, foto o descripción">
          <TablaSimple
            filas={datos.productos.vistosSinVenta}
            columnas={[
              { titulo: 'Producto', valor: (f) => <Link to={`/admin/productos?id=${f.idProducto}`} className="line-clamp-1 font-medium text-ink-900 hover:text-brand-600">{nombreProducto(f.nombre)}</Link> },
              { titulo: 'Vistas', derecha: true, valor: (f) => f.vistas },
              { titulo: 'Al carrito', derecha: true, valor: (f) => f.carritos },
            ]}
          />
        </Seccion>
      </div>

      {/* Búsquedas */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Seccion titulo="Lo más buscado">
          <TablaSimple
            filas={datos.busquedas.top}
            columnas={[
              { titulo: 'Búsqueda', valor: (f) => f.termino },
              { titulo: 'Veces', derecha: true, valor: (f) => f.veces },
              { titulo: 'Resultados', derecha: true, valor: (f) => f.resultados },
            ]}
          />
        </Seccion>
        <Seccion titulo="Búsquedas sin resultados" descripcion="Demanda que hoy se pierde: productos para incorporar o sinónimos a revisar">
          {datos.busquedas.sinResultados.length ? (
            <ul className="flex flex-wrap gap-2">
              {datos.busquedas.sinResultados.map((b) => (
                <li key={b.termino} className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-700">
                  <SearchX className="h-3.5 w-3.5 text-ink-500" /> {b.termino} <strong className="tabular-nums">{b.veces}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="py-4 text-center text-sm text-ink-500">Ninguna búsqueda quedó sin resultados.</p>}
        </Seccion>
      </div>

      {/* Horarios */}
      <Seccion className="mt-6" titulo="¿Cuándo compran?" descripcion="Pedidos por día de la semana y hora">
        <MapaHoras celdas={datos.ventasPorHora} />
      </Seccion>

      {/* Operación */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Seccion titulo="Medio de pago"><DistribucionPedidos filas={datos.operacion.pagos} etiqueta={(k) => PAGOS[k] || k} /></Seccion>
        <Seccion titulo="Forma de entrega"><DistribucionPedidos filas={datos.operacion.envios} etiqueta={(k) => PAGOS[k] || k} /></Seccion>
        <Seccion titulo="Ciudad / sucursal"><DistribucionPedidos filas={datos.operacion.ciudades} etiqueta={(k) => k || 'Sin ciudad'} /></Seccion>
        <Seccion titulo="Dispositivo">
          <DistribucionPedidos
            filas={datos.dispositivos.map((d) => ({ clave: d.dispositivo, pedidos: d.sesiones }))}
            etiqueta={(k) => ({ movil: 'Celular', desktop: 'Computadora', tablet: 'Tablet' }[k] || k)}
          />
          <p className="mt-2 text-[11px] text-ink-500">Cantidad de visitas</p>
        </Seccion>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Seccion titulo="Pedidos por estado">
          <ul className="flex flex-wrap gap-2">
            {Object.entries(ESTADOS_PEDIDO).map(([id, e]) => {
              const n = datos.operacion.estados.find((x) => x.clave === id)?.pedidos || 0;
              return (
                <li key={id}>
                  <Link to={`/admin/pedidos?estado=${id}`} className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset', e.tono)}>
                    {e.label} <span className="tabular-nums">{n}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Seccion>
        <Seccion titulo="Calidad del catálogo">
          <div className="flex items-start gap-4">
            <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', datos.catalogo.sinFoto ? 'bg-amber-50 text-amber-600' : 'bg-leaf-50 text-leaf-700')}>
              {datos.catalogo.sinFoto ? <AlertTriangle className="h-5 w-5" /> : <ImageOff className="h-5 w-5" />}
            </span>
            <div className="text-sm">
              <p><strong className="tabular-nums">{numero.format(datos.catalogo.sinFoto)}</strong> de {numero.format(datos.catalogo.conStock)} productos con stock no tienen foto.</p>
              <p className="mt-1 text-ink-500">Los productos sin foto se venden mucho menos.</p>
              {datos.catalogo.sinFoto > 0 && (
                <Link to="/admin/productos?filtro=sin_foto" className="mt-2 inline-block font-semibold text-brand-600 hover:underline">Cargar fotos →</Link>
              )}
            </div>
          </div>
        </Seccion>
      </div>
    </div>
  );
}
