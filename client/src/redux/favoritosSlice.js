import { createSlice } from "@reduxjs/toolkit";

// Sólo lo necesario para mostrar la tarjeta del producto
const resumen = (p) => ({
  idProducto: p.idProducto,
  codigo: p.codigo,
  nombreMercaderia: p.nombreMercaderia,
  nombreLab: p.nombreLab,
  precio: p.precio,
  precioAnterior: p.precioAnterior,
  imagen: p.imagen || null,
  slug: p.slug,
  stockTotal: p.stockTotal,
});

const favoritosSlice = createSlice({
  name: "favoritos",
  initialState: {
    items: [],
  },
  reducers: {
    toggleFavorito: (state, action) => {
      const p = action.payload;
      const existe = state.items.some(item => item.idProducto === p.idProducto);
      if (existe) {
        state.items = state.items.filter(item => item.idProducto !== p.idProducto);
      } else {
        state.items.unshift(resumen(p));
      }
    },
    // Reemplaza la lista con la de la cuenta (al ingresar o al refrescar precios)
    setFavoritos: (state, action) => {
      state.items = action.payload.map(resumen);
    },
  }
});

export const { toggleFavorito, setFavoritos } = favoritosSlice.actions;

export const selectEsFavorito = (idProducto) => (state) =>
  state.favoritos.items.some(item => item.idProducto === idProducto);

export default favoritosSlice.reducer;
