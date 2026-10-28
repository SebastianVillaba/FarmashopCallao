import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Copy, PackageSearch, Store, Truck } from 'lucide-react';
import { toast } from 'sonner';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import ProductImage from '../Components/ProductImage';
import { WhatsAppLogo } from '../Components/FloatingBubble';
import Button, { buttonClasses } from '../ui/Button';
import { Input } from '../ui/Field';
import { Badge, Card, EmptyState, Skeleton } from '../ui/misc';
import { api, mensajeError } from '../lib/api';
import { nombreProducto, whatsappUrl } from '../lib/texto';
import { formatCurrency } from '../utils/formatCurrency';
import { DATOS_BANCARIOS, METODOS_PAGO, QR_PAGO, SUCURSALES, TIENDA } from '../config/tienda';

const ESTADOS = {
  pendiente: { label: 'Pendiente de pago', tone: 'brand' },
  confirmado: { label: 'Confirmado', tone: 'sky' },
  preparando: { label: 'En preparación', tone: 'sky' },
  enviado: { label: 'En camino', tone: 'leaf' },
  entregado: { label: 'Entregado', tone: 'leaf' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
};

const copiar = (texto) => navigator.clipboard?.writeText(texto).then(() => toast.success('Copiado'));

function Dato({ label, valor }) {
  if (!valor) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-ink-500">{label}</span>
      <button type="button" onClick={() => copiar(valor)} className="flex cursor-pointer items-center gap-2 font-semibold text-ink-900 hover:text-brand-600">
        {valor} <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function InstruccionesPago({ pedido }) {
  if (pedido.estado !== 'pendiente') return null;

  if (pedido.metodoPago === 'contra_entrega') {
    return (
      <p className="text-sm text-ink-600">
        Pagás {pedido.metodoEnvio === 'retiro' ? 'al retirar en la sucursal' : 'al recibir el pedido'}, en efectivo o con tarjeta (POS).
        Te vamos a escribir para confirmar.
      </p>
    );
  }

  const faltanDatos = pedido.metodoPago === 'transferencia' && !DATOS_BANCARIOS.cuenta;
  return (
    <div className="space-y-4">
      {pedido.metodoPago === 'transferencia' ? (
        faltanDatos ? (
          <p className="text-sm text-ink-600">Te enviaremos los datos bancarios por WhatsApp.</p>
        ) : (
          <div className="divide-y divide-ink-100 rounded-2xl bg-ink-50 px-4">
            <Dato label="Banco" valor={DATOS_BANCARIOS.banco} />
            <Dato label="Titular" valor={DATOS_BANCARIOS.titular} />
            <Dato label="RUC" valor={DATOS_BANCARIOS.ruc} />
            <Dato label="Cuenta" valor={DATOS_BANCARIOS.cuenta} />
            <Dato label="Alias" valor={DATOS_BANCARIOS.alias} />
            <Dato label="Monto" valor={formatCurrency(pedido.total)} />
          </div>
        )
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-ink-50 p-5">
          <img src={QR_PAGO} alt="Código QR de pago" className="h-52 w-52 rounded-xl bg-white p-3" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <p className="text-center text-sm text-ink-600">Escaneá con la app de tu banco y pagá <strong>{formatCurrency(pedido.total)}</strong>.</p>
        </div>
      )}
      <a
        href={whatsappUrl(TIENDA.whatsapp, `Hola! Envío el comprobante de pago del pedido ${pedido.nroPedido} por ${formatCurrency(pedido.total)}.`)}
        target="_blank"
        rel="noreferrer"
        className={buttonClasses({ variant: 'whatsapp', size: 'lg', className: 'w-full' })}
      >
        <WhatsAppLogo className="h-5 w-5" /> Enviar comprobante por WhatsApp
      </a>
    </div>
  );
}

// Formulario de búsqueda cuando no hay número en la URL
function BuscarPedido() {
  const navigate = useNavigate();
  const [nro, setNro] = useState('');
  const [email, setEmail] = useState('');
  return (
    <Card className="mx-auto mt-8 max-w-md p-6 sm:p-8">
      <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500"><PackageSearch className="h-7 w-7" /></span>
      <h1 className="text-2xl font-extrabold">Seguí tu pedido</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">Ingresá el número de pedido y el email con el que compraste.</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const limpio = nro.trim().toUpperCase().replace(/^(FS-?)?/, 'FS-');
          navigate(`/pedido/${limpio}?email=${encodeURIComponent(email.trim())}`);
        }}
      >
        <Input label="Número de pedido" placeholder="FS-000123" required value={nro} onChange={(e) => setNro(e.target.value)} />
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" size="lg" className="w-full">Buscar pedido</Button>
      </form>
    </Card>
  );
}

export default function PedidoPage() {
  const { nro } = useParams();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const esNuevo = params.get('nuevo') === '1';
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(!!nro);

  useEffect(() => {
    if (!nro) return;
    setCargando(true);
    api.get(`/pedidos/${encodeURIComponent(nro)}`, { params: { email } })
      .then(({ data }) => setPedido(data.respuesta))
      .catch((err) => setError(err))
      .finally(() => setCargando(false));
  }, [nro, email]);

  if (!nro) return <div className="container-page pt-6"><title>Seguí tu pedido · Farmashop</title><BuscarPedido /></div>;

  if (cargando) {
    return <div className="container-page max-w-3xl space-y-4 pt-10"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>;
  }

  if (error || !pedido) {
    return (
      <div className="container-page pt-10">
        <Card>
          <EmptyState icon={PackageSearch} title="No encontramos el pedido" action={<Link to="/pedido" className={buttonClasses()}>Buscar otro pedido</Link>}>
            {error?.response?.status === 404 ? 'Revisá el número y el email.' : mensajeError(error)}
          </EmptyState>
        </Card>
      </div>
    );
  }

  const estado = ESTADOS[pedido.estado] || ESTADOS.pendiente;
  const sucursal = SUCURSALES.find((s) => s.id === pedido.idSucursal);
  const pago = METODOS_PAGO.find((m) => m.id === pedido.metodoPago);

  return (
    <div className="container-page max-w-4xl pt-6">
      <title>{`Pedido ${pedido.nroPedido} · Farmashop`}</title>
      <CustomBreadcrumbs items={[{ label: 'Pedidos', to: '/pedido' }, { label: pedido.nroPedido }]} />

      {esNuevo && (
        <div className="mt-6 flex flex-col items-center rounded-3xl bg-gradient-to-br from-leaf-500 to-leaf-700 px-6 py-10 text-center text-white">
          <CheckCircle2 className="h-14 w-14" strokeWidth={1.6} />
          <h1 className="mt-4 text-3xl font-extrabold text-white">¡Gracias, {pedido.nombre}!</h1>
          <p className="mt-2 max-w-md text-white/90">Recibimos tu pedido. Te vamos a contactar por WhatsApp al {pedido.telefono} para coordinar.</p>
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 md:grid-cols-[1fr_340px]">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink-500">Pedido</p>
              <p className="font-display text-2xl font-extrabold">{pedido.nroPedido}</p>
            </div>
            <Badge tone={estado.tone}>{estado.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-400">{new Date(pedido.fecha).toLocaleString('es-PY', { dateStyle: 'long', timeStyle: 'short' })}</p>

          <ul className="mt-6 divide-y divide-ink-100 border-y border-ink-100">
            {pedido.items.map((item) => (
              <li key={item.idProducto} className="flex items-center gap-4 py-3">
                <ProductImage src={item.imagen} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-ink-100" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-ink-800">{nombreProducto(item.nombre)}</p>
                  <p className="text-xs text-ink-400">{item.cantidad} × {formatCurrency(item.precioUnitario)}</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(item.subtotal)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{formatCurrency(pedido.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Envío</dt><dd>{pedido.costoEnvio > 0 ? formatCurrency(pedido.costoEnvio) : 'Gratis'}</dd></div>
            <div className="flex justify-between pt-2 text-base font-bold"><dt>Total</dt><dd className="font-display text-xl font-extrabold">{formatCurrency(pedido.total)}</dd></div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-1 text-lg font-bold">Pago: {pago?.titulo}</h2>
            <p className="mb-4 text-sm text-ink-500">{pedido.estado === 'pendiente' ? 'Completá el pago para que preparemos tu pedido.' : 'Pago registrado.'}</p>
            <InstruccionesPago pedido={pedido} />
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              {pedido.metodoEnvio === 'retiro' ? <Store className="h-5 w-5 text-leaf-600" /> : <Truck className="h-5 w-5 text-leaf-600" />}
              {pedido.metodoEnvio === 'retiro' ? 'Retiro en sucursal' : 'Delivery'}
            </h2>
            <p className="text-sm text-ink-600">
              {pedido.metodoEnvio === 'retiro'
                ? <>{sucursal?.nombre}<br /><span className="text-ink-400">{sucursal?.horario}</span></>
                : <>{pedido.calle}{pedido.calleSecundaria ? `, ${pedido.calleSecundaria}` : ''}<br />{pedido.ciudad}</>}
            </p>
          </Card>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/catalogo" className={buttonClasses({ variant: 'outline' })}>Seguir comprando</Link>
      </div>
    </div>
  );
}
