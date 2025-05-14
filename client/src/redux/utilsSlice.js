import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    categoriaSeleccionada: ''
};

const utilsSlice = createSlice({
    name: "utilitarios",
    initialState,
    reducers: {
        setCategoriaSeleccionada: (state, action) => {
            state.categoriaSeleccionada = action.payload;
        },
    }
})

export const { setCategoriaSeleccionada } = utilsSlice.actions;
export default utilsSlice.reducer;


