import { createSlice } from "@reduxjs/toolkit";

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
        state.items.unshift({
          idProducto: p.idProducto,
          codigo: p.codigo,
          nombreMercaderia: p.nombreMercaderia,
          nombreLab: p.nombreLab,
          precio: p.precio,
          imagen: p.imagen || null,
          slug: p.slug,
          stockTotal: p.stockTotal,
        });
      }
    },
  }
});

export const { toggleFavorito } = favoritosSlice.actions;

export const selectEsFavorito = (idProducto) => (state) =>
  state.favoritos.items.some(item => item.idProducto === idProducto);

export default favoritosSlice.reducer;
