import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "carrito",
  initialState: {
    cartData: [],
    showCart: false,
  },
  reducers: {
    addProductoCarrito: (state, action) => {
      const { idProducto, cantidad = 1 } = action.payload;
      const prod = state.cartData.find(item => item.idProducto === idProducto);
      if (prod) {
        // si querés respetar también clamp acá:
        const nueva = prod.cantidad + cantidad;
        prod.cantidad = Math.max(0, nueva);
      } else {
        state.cartData.push({
          ...action.payload,
          cantidad: Math.max(0, cantidad)
        });
      }
    },

    deleteProductoCarrito: (state, action) => {
      state.cartData = state.cartData.filter(
        item => item.idProducto !== action.payload
      );
    },

    updateCantidad: (state, action) => {
        const { idProducto, cantidad } = action.payload;
        const prod = state.cartData.find(item => item.idProducto === idProducto);
        if (prod) {
          // acá evitamos que baje de 0:
          prod.cantidad = Math.max(1, cantidad);
        }
    },

    setShowCart: (state, action) => {
      state.showCart = action.payload;
    }
  }
});

export const {
  addProductoCarrito,
  deleteProductoCarrito,
  updateCantidad,
  setShowCart
} = cartSlice.actions;

export default cartSlice.reducer;
