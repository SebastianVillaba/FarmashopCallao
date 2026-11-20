import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Copy, Download, KeyRound, Loader2, Mail, Search, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Card } from '../../ui/misc';
import Drawer from '../../ui/Drawer';
import { api, mensajeError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { whatsappUrl } from '../../lib/texto';
import { formatCurrency } from '../../utils/formatCurrency';
import useDebounce from '../../hooks/useDebounce';
import { useSesion } from '../sesion';
import { Cargando, Dato, Encabezado, fechaHora } from '../components/ui';

const FILTROS = [['', 'Todos'], ['1', 'Aceptan promociones'], ['0', 'No aceptan']];

function Resumen({ resumen }) {
  const items = [
    ['Clientes activos', resumen.total ?? 0],
    ['Aceptan promociones', resumen.conConsentimiento ?? 0],
    ['Nuevos (30 días)', resumen.ultimos30 ?? 0],
  ];
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {items.map(([label, valor]) => (
        <Card key={label} className="p-4">
          <p className="text-xs font-medium text-ink-500">{label}</p>
          <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{valor.toLocaleString('es-PY')}</p>
        </Card>
      ))}
    </div>
  );
}

function DetalleCliente({ cliente, esAdmin, onCambio }) {
  const [trabajando, setTrabajando] = useState(false);
  const [temporal, setTemporal] = useState(null);

  const cambiarEstado = async () => {
    setTrabajando(true);
    try {
      await api.put(`/admin/clientes/${cliente.idCliente}/estado`, { activo: !cliente.activo });
      toast.success(cliente.activo ? 'Cliente desactivado' : 'Cliente activado');
      onCambio({ ...cliente, activo: !cliente.activo });
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setTrabajando(false);
    }
  };

  const generarTemporal = async () => {
    setTrabajando(true);
    try {
      const { data } = await api.post(`/admin/clientes/${cliente.idCliente}/password-temporal`);
      setTemporal(data.respuesta.password);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setTrabajando(false);
    }
  };

  const mensajeTemporal = temporal && `Hola ${cliente.nombre}, te escribimos de Farmashop. Tu contraseña temporal para ingresar a la web es: ${temporal} . Te recomendamos cambiarla desde "Mi cuenta" al ingresar.`;

  return (
    <div className="space-y-6 p-5">
      <dl className="grid grid-cols-2 gap-4">
        <Dato label="Email" className="col-span-2 break-all">
          <a className="text-brand-600 hover:underline" href={`mailto:${cliente.email}`}>{cliente.email}</a>
        </Dato>
        <Dato label="Celular">
          <a className="text-brand-600 hover:underline" href={whatsappUrl(cliente.telefono, `Hola ${cliente.nombre}, te escribimos de Farmashop.`)} target="_blank" rel="noreferrer">{cliente.telefono}</a>
        </Dato>
        <Dato label="Documento">{cliente.documento}</Dato>
        <Dato label="Ciudad">{cliente.ciudad}</Dato>
        <Dato label="Promociones">{cliente.aceptaComunicaciones ? `Sí, desde ${fechaHora(cliente.fechaConsentimiento)}` : 'No'}</Dato>
        <Dato label="Pedidos">{cliente.pedidos}</Dato>
        <Dato label="Total comprado">{formatCurrency(cliente.totalComprado)}</Dato>
        <Dato label="Último pedido">{fechaHora(cliente.ultimoPedido)}</Dato>
        <Dato label="Último ingreso">{fechaHora(cliente.ultimoLogin)}</Dato>
        <Dato label="Alta">{fechaHora(cliente.fechaAlta)}</Dato>
        <Dato label="Estado">{cliente.activo ? 'Activo' : 'Desactivado'}</Dato>
      </dl>

      {esAdmin && (
        <div className="space-y-3 border-t border-ink-100 pt-5">
          <h3 className="font-bold">Acciones</h3>
          {temporal ? (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm ring-1 ring-amber-200">
              <p className="font-semibold text-amber-900">Contraseña temporal (se muestra una sola vez)</p>
              <p className="mt-2 flex items-center gap-2 font-mono text-lg font-bold tracking-wider text-ink-900">
                {temporal}
                <button type="button" onClick={() => navigator.clipboard?.writeText(temporal).then(() => toast.success('Copiada'))} className="cursor-pointer text-ink-500 hover:text-brand-600" aria-label="Copiar"><Copy className="h-4 w-4" /></button>
              </p>
              <p className="mt-2 text-amber-800">Enviala sólo al celular registrado del cliente.</p>
              <a href={whatsappUrl(cliente.telefono, mensajeTemporal)} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-semibold text-brand-600 hover:underline">Enviar por WhatsApp</a>
            </div>
          ) : cliente.activo && (
            <Button variant="outline" className="w-full" onClick={generarTemporal} disabled={trabajando}>
              <KeyRound className="h-4 w-4" /> Generar contraseña temporal
            </Button>
          )}
          <Button variant="ghost" className={cn('w-full', cliente.activo && 'text-red-600 hover:bg-red-50')} onClick={cambiarEstado} disabled={trabajando}>
            {trabajando ? <Loader2 className="h-4 w-4 animate-spin" /> : cliente.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            {cliente.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ClientesPage() {
  const { usuario } = useSesion();
  const esAdmin = usuario?.rol === 'admin';
  const [params, setParams] = useSearchParams();
  const comunicaciones = params.get('comunicaciones') || '';
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const [termino, setTermino] = useState(params.get('q') || '');
  const q = useDebounce(termino.trim(), 350);
  const [datos, setDatos] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [exportando, setExportando] = useState(false);

  const cambiar = (cambios) => {
    const p = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  const cargar = useCallback(() =>
    api.get('/admin/clientes', { params: { comunicaciones: comunicaciones || undefined, q: q || undefined, pagina } })
      .then(({ data }) => setDatos(data))
      .catch((err) => toast.error(mensajeError(err))), [comunicaciones, q, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  // Por defecto exporta sólo quienes aceptaron promociones; con "Todos" exporta todos (para avisos de servicio)
  const exportar = async () => {
    setExportando(true);
    try {
      const { data, headers } = await api.get('/admin/clientes/exportar', {
        params: { comunicaciones: comunicaciones || 'todos', q: q || undefined },
        responseType: 'blob',
      });
      const nombre = /filename="([^"]+)"/.exec(headers['content-disposition'] || '')?.[1] || 'clientes.csv';
      const url = URL.createObjectURL(data);
      const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('No se pudo exportar');
    } finally {
      setExportando(false);
    }
  };

  const actualizar = (cliente) => {
    setAbierto(cliente);
    cargar();
  };

  return (
    <>
      <Encabezado titulo="Clientes" descripcion="Cuentas creadas en la tienda. Para promociones usá sólo a quienes las aceptaron; los avisos sobre pedidos se pueden enviar a todos.">
        {esAdmin && (
          <Button variant="outline" onClick={exportar} disabled={exportando}>
            {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Exportar CSV
          </Button>
        )}
      </Encabezado>

      {datos?.resumen && <Resumen resumen={datos.resumen} />}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={termino}
            onChange={(e) => { setTermino(e.target.value); if (pagina > 1) cambiar({ pagina: '' }); }}
            placeholder="Nombre, email, celular o documento"
            aria-label="Buscar cliente"
            className="h-11 w-full rounded-xl border border-ink-200 bg-white pr-4 pl-10 text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none"
          />
        </div>
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {FILTROS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => cambiar({ comunicaciones: id, pagina: '' })}
              className={cn('shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition', comunicaciones === id ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50')}
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
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Contacto</th>
                <th className="px-5 py-3 font-semibold">Promociones</th>
                <th className="px-5 py-3 text-right font-semibold">Pedidos</th>
                <th className="px-5 py-3 text-right font-semibold">Comprado</th>
                <th className="px-5 py-3 font-semibold">Alta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {datos.respuesta.map((c) => (
                <tr key={c.idCliente} onClick={() => setAbierto(c)} className={cn('cursor-pointer transition hover:bg-ink-50', !c.activo && 'opacity-50')}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-ink-900">{c.nombre} {c.apellido}</p>
                    <p className="text-xs text-ink-500">{c.ciudad || '—'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-ink-700">{c.email}</p>
                    <p className="text-xs text-ink-500">{c.telefono}</p>
                  </td>
                  <td className="px-5 py-3">
                    {c.aceptaComunicaciones
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-leaf-50 px-2.5 py-0.5 text-xs font-semibold text-leaf-700 ring-1 ring-leaf-100 ring-inset"><Mail className="h-3 w-3" /> Sí</span>
                      : <span className="text-xs text-ink-400">No</span>}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{c.pedidos}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatCurrency(c.totalComprado)}</td>
                  <td className="px-5 py-3 text-ink-600">{new Date(c.fechaAlta).toLocaleDateString('es-PY')}</td>
                </tr>
              ))}
              {!datos.respuesta.length && (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-ink-500">No hay clientes con esos filtros.</td></tr>
              )}
            </tbody>
          </table>
          {datos.paginacion.paginas > 1 && (
            <div className="flex items-center justify-between border-t border-ink-100 px-5 py-3 text-sm">
              <span className="text-ink-500">{datos.paginacion.total} clientes</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" disabled={pagina <= 1} onClick={() => cambiar({ pagina: String(pagina - 1) })} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="tabular-nums">{pagina} / {datos.paginacion.paginas}</span>
                <Button size="icon" variant="ghost" disabled={pagina >= datos.paginacion.paginas} onClick={() => cambiar({ pagina: String(pagina + 1) })} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Drawer open={Boolean(abierto)} onOpenChange={(v) => !v && setAbierto(null)} title={abierto ? `${abierto.nombre} ${abierto.apellido}` : ''} className="max-w-lg">
        {abierto && <DetalleCliente key={abierto.idCliente} cliente={abierto} esAdmin={esAdmin} onCambio={actualizar} />}
      </Drawer>
    </>
  );
}
