import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { SesionContext } from './sesion';

export default function SesionProvider({ children }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/admin/me')
      .then(({ data }) => setUsuario(data.respuesta))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  // Si la sesión vence en medio del trabajo, volver al login
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (error) => {
      const url = error?.config?.url || '';
      if (error?.response?.status === 401 && url.startsWith('/admin') && !url.startsWith('/admin/login') && !url.startsWith('/admin/me')) {
        setUsuario(null);
        navigate('/admin/login', { replace: true, state: { vencida: true } });
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(id);
  }, [navigate]);

  const login = useCallback(async (nick, password) => {
    const { data } = await api.post('/admin/login', { nick, password });
    setUsuario(data.respuesta);
    return data.respuesta;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/admin/logout').catch(() => {});
    setUsuario(null);
    navigate('/admin/login', { replace: true });
  }, [navigate]);

  const valor = useMemo(() => ({ usuario, cargando, login, logout }), [usuario, cargando, login, logout]);
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
