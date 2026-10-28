import { configureStore } from "@reduxjs/toolkit";
import carritoReducer from './cartSlice'
import favoritosReducer from './favoritosSlice'

const STORAGE_KEY = 'farmashop:v1';

// El carrito y los favoritos sobreviven a recargas de página
const cargarEstado = () => {
    try {
        const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!guardado) return undefined;
        return {
            carrito: { cartData: guardado.cartData || [], showCart: false },
            favoritos: { items: guardado.favoritos || [] },
        };
    } catch {
        return undefined;
    }
};

export const store = configureStore({
    reducer: {
        carrito: carritoReducer,
        favoritos: favoritosReducer,
    },
    preloadedState: cargarEstado(),
})

let ultimo;
store.subscribe(() => {
    const { carrito, favoritos } = store.getState();
    const serializado = JSON.stringify({ cartData: carrito.cartData, favoritos: favoritos.items });
    if (serializado === ultimo) return;
    ultimo = serializado;
    try {
        localStorage.setItem(STORAGE_KEY, serializado);
    } catch {
        // almacenamiento lleno o bloqueado: se sigue sin persistir
    }
});
