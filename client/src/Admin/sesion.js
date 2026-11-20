import { createContext, useContext } from 'react';

export const SesionContext = createContext({ usuario: null, cargando: true, login: async () => {}, logout: async () => {} });

// Usuario logueado en el panel
export const useSesion = () => useContext(SesionContext);
