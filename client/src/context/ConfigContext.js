import { createContext, useContext } from 'react';

export const CONFIG_INICIAL = { tema: 'default', ga4Id: null, banners: {}, cargado: false };

export const ConfigContext = createContext({ ...CONFIG_INICIAL, recargar: () => {} });

// Configuración global de la web (temática, banners, GA4) definida desde el panel
export const useConfig = () => useContext(ConfigContext);
