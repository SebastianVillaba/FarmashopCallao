import { createContext, useContext } from 'react';

// Datos del último pedido como invitado (se precargan en el checkout)
export const CLAVE_CLIENTE_LOCAL = 'farmashop:cliente';

export const CuentaContext = createContext({
  cliente: null,
  cargando: true,
  login: async () => {},
  registro: async () => {},
  logout: async () => {},
  setCliente: () => {},
});

// Cliente logueado en la tienda (null si navega como invitado)
export const useCuenta = () => useContext(CuentaContext);
