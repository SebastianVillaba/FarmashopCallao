import { createSlice } from "@reduxjs/toolkit";

const MAX_CANTIDAD = 99;

// Tope por stock disponible (si se conoce) y por máximo por ítem
const limitar = (cantidad, stock) => {
  const tope = Number.isFinite(stock) && stock > 0 ? Math.min(stock, MAX_CANTIDAD) : MAX_CANTIDAD;
  return Math.min(Math.max(1, cantidad), tope);
};

// Sólo se guardan los datos necesarios para mostrar el carrito
const itemCarrito = (p, cantidad) => ({
  idProducto: p.idProducto,
  codigo: p.codigo,
  nombreMercaderia: p.nombreMercaderia,
  nombreLab: p.nombreLab,
  precio: p.precio,
  imagen: p.imagen || null,
  slug: p.slug,
  stockTotal: p.stockTotal,
  cantidad: limitar(cantidad, p.stockTotal),
});

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
        prod.cantidad = limitar(prod.cantidad + cantidad, prod.stockTotal);
      } else {
        state.cartData.push(itemCarrito(action.payload, cantidad));
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
        prod.cantidad = limitar(cantidad, prod.stockTotal);
      }
    },

    vaciarCarrito: (state) => {
      state.cartData = [];
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
  vaciarCarrito,
  setShowCart
} = cartSlice.actions;

export const selectCantidadTotal = (state) =>
  state.carrito.cartData.reduce((acc, item) => acc + item.cantidad, 0);

export const selectSubtotal = (state) =>
  state.carrito.cartData.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

export default cartSlice.reducer;
