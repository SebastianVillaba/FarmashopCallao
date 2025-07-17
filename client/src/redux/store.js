import { configureStore } from "@reduxjs/toolkit";
import utilsReducer from './utilsSlice'
import carritoReducer from './cartSlice'
import searchReducer from "./searchSlice"

export const store = configureStore({
    reducer: {
        utilitarios: utilsReducer,
        carrito: carritoReducer,
        busqueda: searchReducer
    }
})