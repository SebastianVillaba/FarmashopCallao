import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag, Trash2, Truck } from 'lucide-react';
import Drawer from '../ui/Drawer';
import Button from '../ui/Button';
import { EmptyState, QuantityStepper } from '../ui/misc';
import ProductImage from './ProductImage';
import { urlProducto } from './TarjetaProducto';
import { nombreProducto } from '../lib/texto';
import { formatCurrency } from '../utils/formatCurrency';
import { deleteProductoCarrito, selectCantidadTotal, selectSubtotal, setShowCart, updateCantidad } from '../redux/cartSlice';

// Fila de producto reutilizada en el drawer y en la página del carrito
export function ItemCarrito({ item, onNavigate, compacto = false }) {
  const dispatch = useDispatch();
  const nombre = nombreProducto(item.nombreMercaderia);
  const max = item.stockTotal > 0 ? Math.min(item.stockTotal, 99) : 99;

  return (
    <div className="flex gap-4 py-4">
      <Link to={urlProducto(item)} onClick={onNavigate} className="shrink-0">
        <ProductImage src={item.imagen} alt={nombre} className={compacto ? 'h-20 w-20 rounded-2xl border border-ink-100' : 'h-24 w-24 rounded-2xl border border-ink-100 sm:h-28 sm:w-28'} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={urlProducto(item)} onClick={onNavigate} className="line-clamp-2 text-sm font-medium text-ink-800 hover:text-brand-600">
              {nombre}
            </Link>
            {item.nombreLab && <p className="mt-0.5 text-xs text-ink-400">{item.nombreLab}</p>}
          </div>
          <button
            type="button"
            onClick={() => dispatch(deleteProductoCarrito(item.idProducto))}
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-ink-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label={`Quitar ${nombre}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <QuantityStepper
            size="sm"
            value={item.cantidad}
            max={max}
            onChange={(cantidad) => dispatch(updateCantidad({ idProducto: item.idProducto, cantidad }))}
          />
          <div className="text-right">
            <p className="font-bold text-ink-900">{formatCurrency(item.precio * item.cantidad)}</p>
            {item.cantidad > 1 && <p className="text-xs text-ink-400">{formatCurrency(item.precio)} c/u</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const abierto = useSelector((state) => state.carrito.showCart);
  const items = useSelector((state) => state.carrito.cartData);
  const cantidad = useSelector(selectCantidadTotal);
  const subtotal = useSelector(selectSubtotal);
  const cerrar = () => dispatch(setShowCart(false));

  const ir = (url) => {
    cerrar();
    navigate(url);
  };

  return (
    <Drawer
      open={abierto}
      onOpenChange={(v) => dispatch(setShowCart(v))}
      title={`Tu carrito${cantidad ? ` (${cantidad})` : ''}`}
      footer={items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-ink-600">Subtotal</span>
            <span className="font-display text-xl font-extrabold">{formatCurrency(subtotal)}</span>
          </div>
          <p className="flex items-center gap-2 text-xs text-ink-500">
            <Truck className="h-4 w-4 text-leaf-600" /> Retiro gratis en sucursal. El delivery se calcula en el checkout.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => ir('/cart')}>Ver carrito</Button>
            <Button onClick={() => ir('/checkout')}>Finalizar compra</Button>
          </div>
        </div>
      )}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Tu carrito está vacío"
          action={<Button onClick={() => ir('/catalogo')}>Explorar productos</Button>}
        >
          Agregá productos y los vas a ver acá.
        </EmptyState>
      ) : (
        <div className="divide-y divide-ink-100 px-5">
          {items.map((item) => <ItemCarrito key={item.idProducto} item={item} onNavigate={cerrar} compacto />)}
        </div>
      )}
    </Drawer>
  );
}
