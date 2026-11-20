import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { configurarGa4 } from '../lib/analytics';
import { CONFIG_INICIAL, ConfigContext } from './ConfigContext';

const REVALIDAR_MS = 60 * 1000;

// La temática es global: la define el panel en el servidor y se aplica igual en todos los
// dispositivos y en toda la web (tienda y panel). No se guarda nada en el navegador.
export default function ConfigProvider({ children }) {
  const [config, setConfig] = useState(CONFIG_INICIAL);

  const recargar = useCallback(() =>
    api.get('/config')
      .then(({ data }) => setConfig({ ...CONFIG_INICIAL, ...data.respuesta, cargado: true }))
      .catch(() => setConfig((c) => ({ ...c, cargado: true }))), []);

  useEffect(() => {
    recargar();
    const timer = setInterval(() => document.visibilityState === 'visible' && recargar(), REVALIDAR_MS);
    const alVolver = () => document.visibilityState === 'visible' && recargar();
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [recargar]);

  useEffect(() => {
    document.documentElement.dataset.tema = config.tema || 'default';
  }, [config.tema]);

  useEffect(() => {
    configurarGa4(config.ga4Id);
  }, [config.ga4Id]);

  const valor = useMemo(() => ({ ...config, recargar }), [config, recargar]);
  return <ConfigContext.Provider value={valor}>{children}</ConfigContext.Provider>;
}
