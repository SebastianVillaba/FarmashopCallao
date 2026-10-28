import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import ProductImage from '../Components/ProductImage';
import { ResumenTotales } from './CartPage';
import { PasoDatos, PasoEntrega, PasoPago, PasoRevision } from './Checkout/Pasos';
import { CAMPOS_POR_PASO, aPayload, checkoutSchema } from './Checkout/schema';
import Button from '../ui/Button';
import { Card, Stepper } from '../ui/misc';
import { api, mensajeError } from '../lib/api';
import { nombreProducto } from '../lib/texto';
import { formatCurrency } from '../utils/formatCurrency';
import { selectSubtotal, updateCantidad, deleteProductoCarrito, vaciarCarrito } from '../redux/cartSlice';
import { COSTO_DELIVERY } from '../config/tienda';
import logoImg from '../assets/farmaShop/cropped-Farmashop-astra-180-x-60.png';

const PASOS = ['Datos', 'Entrega', 'Pago', 'Confirmar'];
const CLAVE_CLIENTE = 'farmashop:cliente';

// Los datos personales se recuerdan para la próxima compra
const datosGuardados = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CLIENTE)) || {};
  } catch {
    return {};
  }
};

function ResumenLateral({ items, subtotal }) {
  const metodoEnvio = useWatch({ name: 'metodoEnvio' });
  return (
    <Card className="p-6 lg:sticky lg:top-6">
      <h2 className="mb-4 text-lg font-bold">Tu pedido</h2>
      <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.idProducto} className="flex items-center gap-3">
            <div className="relative shrink-0">
              <ProductImage src={item.imagen} alt="" className="h-14 w-14 rounded-xl border border-ink-100" />
              <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink-700 px-1 text-[11px] font-bold text-white">{item.cantidad}</span>
            </div>
            <p className="line-clamp-2 flex-1 text-sm text-ink-700">{nombreProducto(item.nombreMercaderia)}</p>
            <p className="text-sm font-semibold text-ink-900">{formatCurrency(item.precio * item.cantidad)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-5 border-t border-ink-100 pt-5">
        <ResumenTotales subtotal={subtotal} costoEnvio={COSTO_DELIVERY} metodoEnvio={metodoEnvio} />
      </div>
    </Card>
  );
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.carrito.cartData);
  const subtotal = useSelector(selectSubtotal);
  const [paso, setPaso] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const metodos = useForm({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: {
      nombre: '', apellido: '', email: '', telefono: '', documento: '', dv: '', razonSocial: '',
      ...datosGuardados(),
      metodoEnvio: 'retiro', idSucursal: '', calle: '', calleSecundaria: '', referencia: '', ciudad: '', observacion: '',
      metodoPago: undefined,
    },
  });

  if (items.length === 0 && !enviando) return <Navigate to="/cart" replace />;

  const irAPaso = (n) => {
    setPaso(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const siguiente = async () => {
    const ok = await metodos.trigger(CAMPOS_POR_PASO[paso]);
    if (ok) irAPaso(paso + 1);
  };

  const confirmar = metodos.handleSubmit(async (datos) => {
    setEnviando(true);
    try {
      const { data } = await api.post('/pedidos', aPayload(datos, items));
      const { nombre, apellido, email, telefono, documento, dv, razonSocial } = datos;
      try {
        localStorage.setItem(CLAVE_CLIENTE, JSON.stringify({ nombre, apellido, email, telefono, documento, dv, razonSocial }));
      } catch {
        // sin persistencia
      }
      dispatch(vaciarCarrito());
      navigate(`/pedido/${data.respuesta.nroPedido}?email=${encodeURIComponent(data.respuesta.email)}&nuevo=1`, { replace: true });
    } catch (err) {
      setEnviando(false);
      const problemas = err.response?.data?.problemas;
      if (err.response?.status === 409 && problemas) {
        // Ajustar el carrito al stock real y avisar
        problemas.forEach((p) => {
          if (p.motivo === 'stock_insuficiente' && p.disponible > 0) dispatch(updateCantidad({ idProducto: p.idProducto, cantidad: p.disponible }));
          else dispatch(deleteProductoCarrito(p.idProducto));
        });
        toast.error('Algunos productos cambiaron de stock', { description: 'Ajustamos tu carrito. Revisalo y confirmá de nuevo.' });
      } else {
        toast.error('No pudimos registrar tu pedido', { description: mensajeError(err) });
      }
    }
  }, () => {
    toast.error('Revisá los datos del formulario');
    irAPaso(0);
  });

  return (
    <div className="min-h-screen bg-ink-50">
      <title>Finalizar compra · Farmashop</title>
      <header className="border-b border-ink-100 bg-white">
        <div className="container-page flex h-18 items-center justify-between">
          <Link to="/home"><img src={logoImg} alt="Farmashop" className="h-9 w-auto" /></Link>
          <span className="flex items-center gap-2 text-sm font-medium text-ink-500"><Lock className="h-4 w-4 text-leaf-600" /> Compra segura</span>
        </div>
      </header>

      <FormProvider {...metodos}>
        <form onSubmit={(e) => e.preventDefault()} className="container-page grid items-start gap-8 py-8 lg:grid-cols-[1fr_400px]" noValidate>
          <div className="min-w-0 space-y-6">
            <Card className="p-5 sm:px-8"><Stepper pasos={PASOS} actual={paso} /></Card>

            <Card className="p-5 sm:p-8">
              {paso === 0 && <PasoDatos />}
              {paso === 1 && <PasoEntrega />}
              {paso === 2 && <PasoPago />}
              {paso === 3 && <PasoRevision irAPaso={irAPaso} />}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:justify-between">
                {paso === 0 ? (
                  <Button variant="ghost" onClick={() => navigate('/cart')}><ArrowLeft className="h-4 w-4" /> Volver al carrito</Button>
                ) : (
                  <Button variant="ghost" onClick={() => irAPaso(paso - 1)} disabled={enviando}><ArrowLeft className="h-4 w-4" /> Atrás</Button>
                )}
                {paso < PASOS.length - 1 ? (
                  <Button size="lg" onClick={siguiente}>Continuar <ArrowRight className="h-4 w-4" /></Button>
                ) : (
                  <Button size="lg" onClick={confirmar} disabled={enviando}>
                    {enviando ? <><Loader2 className="h-5 w-5 animate-spin" /> Enviando…</> : <><Lock className="h-4 w-4" /> Confirmar pedido</>}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <ResumenLateral items={items} subtotal={subtotal} />
        </form>
      </FormProvider>
    </div>
  );
}
