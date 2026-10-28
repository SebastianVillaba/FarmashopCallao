import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { addProductoCarrito, setShowCart } from '../redux/cartSlice';
import { nombreProducto } from '../lib/texto';

// Agrega al carrito y avisa con un toast que permite abrirlo
export default function useAgregarAlCarrito() {
  const dispatch = useDispatch();

  return (producto, cantidad = 1) => {
    dispatch(addProductoCarrito({ ...producto, cantidad }));
    toast.success('Agregado al carrito', {
      description: nombreProducto(producto.nombreMercaderia),
      action: { label: 'Ver carrito', onClick: () => dispatch(setShowCart(true)) },
    });
  };
}
