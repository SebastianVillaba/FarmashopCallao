import { configureStore } from "@reduxjs/toolkit";
import utilsReducer from './utilsSlice'
import carritoReducer from './cartSlice'

export const store = configureStore({
    reducer: {
        utilitarios: utilsReducer,
        carrito: carritoReducer
    }
})