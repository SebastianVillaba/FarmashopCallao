import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { api, mensajeError } from '../lib/api';
import { useCuenta } from '../context/CuentaContext';
import { selectEsFavorito, toggleFavorito } from '../redux/favoritosSlice';

// Marca/desmarca un favorito. Sin sesión queda en el navegador; con sesión también en la cuenta.
export default function useFavorito(producto) {
  const dispatch = useDispatch();
  const { cliente } = useCuenta();
  const idProducto = producto ? Number(producto.idProducto) : null;
  const esFavorito = useSelector(selectEsFavorito(idProducto));

  const alternar = useCallback(async () => {
    if (!producto) return;
    const agregar = !esFavorito;
    dispatch(toggleFavorito(producto));
    if (!cliente) return;
    try {
      if (agregar) await api.put(`/cuenta/favoritos/${idProducto}`);
      else await api.delete(`/cuenta/favoritos/${idProducto}`);
    } catch (err) {
      // Revertir el cambio optimista
      dispatch(toggleFavorito(producto));
      toast.error('No pudimos actualizar tus favoritos', { description: mensajeError(err) });
    }
  }, [cliente, dispatch, esFavorito, idProducto, producto]);

  return { esFavorito, alternar };
}
