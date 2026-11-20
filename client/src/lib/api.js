import axios from 'axios';

// withCredentials: la sesión del panel viaja en una cookie httpOnly
export const api = axios.create({ baseURL: '/api', withCredentials: true });

// Mensaje legible a partir de un error de axios
export const mensajeError = (error, porDefecto = 'Ocurrió un error, intentá de nuevo') =>
  error?.response?.data?.error || porDefecto;
