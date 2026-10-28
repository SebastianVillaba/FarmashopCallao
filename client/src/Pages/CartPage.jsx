import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Lock, ShoppingBag, Store, Truck } from 'lucide-react';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import { ItemCarrito } from '../Components/CartView';
import Button, { buttonClasses } from '../ui/Button';
import { Card, EmptyState } from '../ui/misc';
import { formatCurrency } from '../utils/formatCurrency';
import { selectCantidadTotal, selectSubtotal, vaciarCarrito } from '../redux/cartSlice';
import { COSTO_DELIVERY } from '../config/tienda';

export function ResumenTotales({ subtotal, costoEnvio, metodoEnvio }) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink-600">Subtotal</dt>
        <dd className="font-semibold text-ink-900">{formatCurrency(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-ink-600">Envío</dt>
        <dd className="font-semibold text-ink-900">
          {metodoEnvio === 'retiro' ? <span className="text-leaf-600">Gratis</span>
            : metodoEnvio === 'delivery' ? formatCurrency(costoEnvio)
            : <span className="font-normal text-ink-500">Se calcula al finalizar</span>}
        </dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-ink-100 pt-4">
        <dt className="text-base font-bold text-ink-900">Total</dt>
        <dd className="font-display text-2xl font-extrabold text-ink-900">{formatCurrency(subtotal + (metodoEnvio === 'delivery' ? costoEnvio : 0))}</dd>
      </div>
    </dl>
  );
}

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartData = useSelector((state) => state.carrito.cartData);
  const cantidad = useSelector(selectCantidadTotal);
  const subtotal = useSelector(selectSubtotal);

  return (
    <div className="container-page pt-6">
      <title>Carrito · Farmashop</title>
      <CustomBreadcrumbs items={[{ label: 'Carrito' }]} />

      {cartData.length === 0 ? (
        <Card className="mt-8">
          <EmptyState icon={ShoppingBag} title="Tu carrito está vacío" action={<Link to="/catalogo" className={buttonClasses()}>Explorar productos</Link>}>
            Cuando agregues productos los vas a ver acá.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="mt-5 mb-6 flex items-end justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Tu carrito <span className="text-ink-400">({cantidad})</span>
            </h1>
            <button type="button" onClick={() => dispatch(vaciarCarrito())} className="cursor-pointer text-sm font-semibold text-ink-500 hover:text-red-600">
              Vaciar carrito
            </button>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
            <Card className="divide-y divide-ink-100 px-5 sm:px-6">
              {cartData.map((item) => <ItemCarrito key={item.idProducto} item={item} />)}
            </Card>

            <Card className="p-6 lg:sticky lg:top-40">
              <h2 className="mb-5 text-lg font-bold">Resumen del pedido</h2>
              <ResumenTotales subtotal={subtotal} costoEnvio={COSTO_DELIVERY} />
              <Button size="lg" className="mt-6 w-full" onClick={() => navigate('/checkout')}>
                <Lock className="h-4 w-4" /> Finalizar compra
              </Button>
              <Link to="/catalogo" className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-brand-600">
                <ArrowLeft className="h-4 w-4" /> Seguir comprando
              </Link>
              <ul className="mt-6 space-y-2 border-t border-ink-100 pt-5 text-xs text-ink-500">
                <li className="flex items-center gap-2"><Store className="h-4 w-4 text-leaf-600" /> Retiro gratis en sucursal</li>
                <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-leaf-600" /> Delivery desde {formatCurrency(COSTO_DELIVERY)}</li>
              </ul>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
