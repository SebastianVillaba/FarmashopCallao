import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Select } from '../../ui/Field';
import { Card } from '../../ui/misc';
import Drawer from '../../ui/Drawer';
import ProductImage from '../../Components/ProductImage';
import { api, mensajeError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { nombreProducto, whatsappUrl } from '../../lib/texto';
import { formatCurrency } from '../../utils/formatCurrency';
import useDebounce from '../../hooks/useDebounce';
import { Cargando, Dato, ESTADOS_PEDIDO, Encabezado, EstadoPedido, fechaHora } from '../components/ui';

const PAGOS = { transferencia: 'Transferencia', qr: 'QR', contra_entrega: 'Contra entrega' };

function DetallePedido({ idPedido, onCambio }) {
  const [pedido, setPedido] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setPedido(null);
    api.get(`/admin/pedidos/${idPedido}`).then(({ data }) => setPedido(data.respuesta)).catch((err) => toast.error(mensajeError(err)));
  }, [idPedido]);

  if (!pedido) return <Cargando className="min-h-60" />;

  const cambiarEstado = async (estado) => {
    setGuardando(true);
    try {
      await api.put(`/admin/pedidos/${idPedido}/estado`, { estado });
      setPedido((p) => ({ ...p, estado }));
      onCambio();
      toast.success(`Pedido ${ESTADOS_PEDIDO[estado].label.toLowerCase()}`);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6 p-5">
      <div className="flex items-end gap-3">
        <Select label="Estado" className="flex-1" value={pedido.estado} onChange={(e) => cambiarEstado(e.target.value)} disabled={guardando}>
          {Object.entries(ESTADOS_PEDIDO).map(([id, e]) => <option key={id} value={id}>{e.label}</option>)}
        </Select>
        {guardando && <Loader2 className="mb-3.5 h-5 w-5 animate-spin text-brand-500" />}
      </div>

      <dl className="grid grid-cols-2 gap-4">
        <Dato label="Fecha">{fechaHora(pedido.fecha)}</Dato>
        <Dato label="Total">{formatCurrency(pedido.total)}</Dato>
        <Dato label="Cliente">{pedido.nombre} {pedido.apellido}</Dato>
        <Dato label="Documento">{pedido.documento}{pedido.dv ? `-${pedido.dv}` : ''}</Dato>
        <Dato label="Email" className="col-span-2 break-all">{pedido.email}</Dato>
        <Dato label="Teléfono">
          <a className="text-brand-600 hover:underline" href={whatsappUrl(pedido.telefono, `Hola ${pedido.nombre}, te escribimos de Farmashop por tu pedido ${pedido.nroPedido}.`)} target="_blank" rel="noreferrer">{pedido.telefono}</a>
        </Dato>
        <Dato label="Pago">{PAGOS[pedido.metodoPago] || pedido.metodoPago}</Dato>
        <Dato label="Entrega" className="col-span-2">
          {pedido.metodoEnvio === 'retiro'
            ? `Retiro en sucursal ${pedido.idSucursal}`
            : [pedido.calle, pedido.calleSecundaria, pedido.ciudad].filter(Boolean).join(', ')}
          {pedido.referencia && <span className="block font-normal text-ink-500">Ref: {pedido.referencia}</span>}
        </Dato>
        {pedido.razonSocial && <Dato label="Razón social" className="col-span-2">{pedido.razonSocial}</Dato>}
        {pedido.observacion && <Dato label="Observación" className="col-span-2">{pedido.observacion}</Dato>}
        <Dato label="Origen">{pedido.fuente ? `${pedido.fuente}${pedido.medio ? ` / ${pedido.medio}` : ''}` : 'Sin datos'}</Dato>
        <Dato label="Campaña">{pedido.campania}</Dato>
      </dl>

      <div>
        <h3 className="mb-2 font-bold">Productos</h3>
        <ul className="divide-y divide-ink-100 rounded-2xl border border-ink-100">
          {pedido.items.map((i) => (
            <li key={i.idProducto} className="flex items-center gap-3 p-3">
              <ProductImage src={i.imagen} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-ink-100" />
              <span className="min-w-0 flex-1 text-sm">
                <span className="line-clamp-2 font-medium text-ink-900">{nombreProducto(i.nombre)}</span>
                <span className="text-xs text-ink-500">Cód. {i.codigo} · {i.cantidad} × {formatCurrency(i.precioUnitario)}</span>
              </span>
              <span className="text-sm font-semibold">{formatCurrency(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{formatCurrency(pedido.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Envío</dt><dd>{formatCurrency(pedido.costoEnvio)}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatCurrency(pedido.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}

export default function PedidosPage() {
  const [params, setParams] = useSearchParams();
  const estado = params.get('estado') || '';
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const [termino, setTermino] = useState(params.get('q') || '');
  const q = useDebounce(termino.trim(), 350);
  const [datos, setDatos] = useState(null);
  const [abierto, setAbierto] = useState(null);

  const cambiar = (cambios) => {
    const p = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  const cargar = useCallback(() =>
    api.get('/admin/pedidos', { params: { estado: estado || undefined, q: q || undefined, pagina } })
      .then(({ data }) => setDatos(data))
      .catch((err) => toast.error(mensajeError(err))), [estado, q, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <>
      <Encabezado titulo="Pedidos" descripcion="Pedidos hechos en la web. Marcá 'Entregado' para que cuenten como ventas finalizadas en las estadísticas." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={termino}
            onChange={(e) => { setTermino(e.target.value); if (pagina > 1) cambiar({ pagina: '' }); }}
            placeholder="Nº de pedido, email, nombre o documento"
            aria-label="Buscar pedido"
            className="h-11 w-full rounded-xl border border-ink-200 bg-white pr-4 pl-10 text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
          />
        </div>
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {[['', 'Todos'], ...Object.entries(ESTADOS_PEDIDO).map(([id, e]) => [id, e.label])].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => cambiar({ estado: id, pagina: '' })}
              className={cn('shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition', estado === id ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!datos ? <Cargando /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-ink-100 text-xs text-ink-500 uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Pedido</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Entrega / pago</th>
                <th className="px-5 py-3 font-semibold">Origen</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {datos.respuesta.map((p) => (
                <tr key={p.idPedido} onClick={() => setAbierto(p)} className="cursor-pointer transition hover:bg-ink-50">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-ink-900">{p.nroPedido}</p>
                    <p className="text-xs text-ink-500">{fechaHora(p.fecha)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{p.nombre} {p.apellido}</p>
                    <p className="text-xs text-ink-500">{p.telefono}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {p.metodoEnvio === 'retiro' ? 'Retiro' : `Delivery · ${p.ciudad || ''}`}
                    <p className="text-xs text-ink-500">{PAGOS[p.metodoPago] || p.metodoPago} · {p.unidades} u.</p>
                  </td>
                  <td className="px-5 py-3 text-ink-600 capitalize">{p.fuente || '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatCurrency(p.total)}</td>
                  <td className="px-5 py-3"><EstadoPedido estado={p.estado} /></td>
                </tr>
              ))}
              {!datos.respuesta.length && (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-ink-500">No hay pedidos con esos filtros.</td></tr>
              )}
            </tbody>
          </table>
          {datos.paginacion.paginas > 1 && (
            <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3 text-sm">
              <span className="text-ink-500">{datos.paginacion.total} pedidos</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" disabled={pagina <= 1} onClick={() => cambiar({ pagina: String(pagina - 1) })} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="tabular-nums">{pagina} / {datos.paginacion.paginas}</span>
                <Button size="icon" variant="ghost" disabled={pagina >= datos.paginacion.paginas} onClick={() => cambiar({ pagina: String(pagina + 1) })} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Drawer open={Boolean(abierto)} onOpenChange={(v) => !v && setAbierto(null)} title={abierto ? `Pedido ${abierto.nroPedido}` : ''} className="max-w-lg">
        {abierto && <DetallePedido idPedido={abierto.idPedido} onCambio={cargar} />}
      </Drawer>
    </>
  );
}
