import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { api } from '../lib/api';
import { setFavoritos } from '../redux/favoritosSlice';
import { CLAVE_CLIENTE_LOCAL, CuentaContext } from './CuentaContext';

const RUTAS_SIN_SESION = ['/cuenta/login', '/cuenta/registro', '/cuenta/logout'];

export default function CuentaProvider({ children }) {
  const dispatch = useDispatch();
  const store = useStore();
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Con sesión, la cuenta es la fuente de verdad de los favoritos (precios y stock al día)
  useEffect(() => {
    api.get('/cuenta/me')
      .then(({ data }) => {
        setCliente(data.respuesta);
        return api.get('/cuenta/favoritos').then(({ data: f }) => dispatch(setFavoritos(f.respuesta)));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, [dispatch]);

  // Si la sesión vence (o se cambia la contraseña en otro dispositivo) se pasa a modo invitado
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (error) => {
      const url = error?.config?.url || '';
      if (error?.response?.status === 401 && url.startsWith('/cuenta') && !RUTAS_SIN_SESION.includes(url)) {
        setCliente(null);
      }
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(id);
  }, []);

  // Los favoritos guardados como invitado se suman a la cuenta
  const iniciar = useCallback(async (datos) => {
    setCliente(datos);
    const ids = store.getState().favoritos.items.map((f) => f.idProducto);
    try {
      const { data } = await api.post('/cuenta/favoritos/sincronizar', { ids });
      dispatch(setFavoritos(data.respuesta));
    } catch {
      // se reintenta en la próxima carga
    }
    return datos;
  }, [dispatch, store]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/cuenta/login', { email, password });
    return iniciar(data.respuesta);
  }, [iniciar]);

  const registro = useCallback(async (datos) => {
    const { data } = await api.post('/cuenta/registro', datos);
    return iniciar(data.respuesta);
  }, [iniciar]);

  // En equipos compartidos no deben quedar datos del cliente
  const logout = useCallback(async () => {
    await api.post('/cuenta/logout').catch(() => {});
    setCliente(null);
    dispatch(setFavoritos([]));
    try {
      localStorage.removeItem(CLAVE_CLIENTE_LOCAL);
    } catch {
      // sin acceso al almacenamiento
    }
  }, [dispatch]);

  const valor = useMemo(() => ({ cliente, cargando, login, registro, logout, setCliente }), [cliente, cargando, login, registro, logout]);
  return <CuentaContext.Provider value={valor}>{children}</CuentaContext.Provider>;
}
