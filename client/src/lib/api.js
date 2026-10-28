import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

// Mensaje legible a partir de un error de axios
export const mensajeError = (error, porDefecto = 'Ocurrió un error, intentá de nuevo') =>
  error?.response?.data?.error || porDefecto;
