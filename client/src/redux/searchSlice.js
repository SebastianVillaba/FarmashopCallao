import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const buscarProductos = createAsyncThunk(
  'search/buscarProductos',
  async (palabra, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/productos/buscarProducto", {
        params: { palabra }
      });
      return response.data.respuesta;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const buscarProductosPorCategoria = createAsyncThunk(
  'search/buscarProductosPorCategoria',
  async (idCategoria, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/productos/buscarProductoCategoria", {
        params: { idCategoria }
      });
      return response.data.respuesta;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Error en la búsqueda");
    }
  }
);


const searchSlice = createSlice({
  name: "search",
  initialState: {
    resultados: [],
    palabra: "",
    estado: "inactivo", // inactivo | cargando | completado | error
    error: null,
    categoria: null,
    tipoBusqueda: "termino" // 'termino' o 'categoria'
  },
  reducers: {
    limpiarBusqueda: (state) => {
      state.resultados = [];
      state.palabra = "";
      state.estado = "inactivo";
      state.error = null;
      state.categoria = null;
      state.tipoBusqueda = "termino";
    },
    limpiarCategoria: (state) => {
      state.categoria = null;
      state.tipoBusqueda = "termino";
    }

  },
  extraReducers: (builder) => {
    builder
      .addCase(buscarProductos.pending, (state) => {
        state.estado = "cargando";
        state.error = null;
      })
      .addCase(buscarProductos.fulfilled, (state, action) => {
        state.estado = "completado";
        state.resultados = action.payload;
        state.palabra = action.meta.arg;
      })
      .addCase(buscarProductos.rejected, (state, action) => {
        state.estado = "error";
        state.error = action.payload || "Error en la búsqueda";
      });
    // Nuevo caso para buscar por categoría
    builder
    .addCase(buscarProductosPorCategoria.pending, (state) => {
      state.estado = "cargando";
      state.error = null;
      state.tipoBusqueda = "categoria";
    })
    .addCase(buscarProductosPorCategoria.fulfilled, (state, action) => {
      state.estado = "completado";
      state.resultados = action.payload;
      state.categoria = action.meta.arg;
      state.tipoBusqueda = "categoria";
    })
    .addCase(buscarProductosPorCategoria.rejected, (state, action) => {
      state.estado = "error";
      state.error = action.payload || "Error al cargar la categoría";
      state.tipoBusqueda = "categoria";
    });
  }
});

export const { limpiarBusqueda, limpiarCategoria  } = searchSlice.actions;
export default searchSlice.reducer;