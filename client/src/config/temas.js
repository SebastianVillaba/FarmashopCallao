// Temáticas disponibles. Los colores están en index.css ([data-tema="..."]).
export const TEMAS = {
  default: {
    nombre: 'Farmashop (por defecto)',
    descripcion: 'Colores de marca, sin decoración.',
    mensaje: 'Delivery a domicilio y retiro gratis en sucursal',
    colores: ['#d4459f', '#307fe0', '#84c13d'],
  },
  navidad: {
    nombre: 'Navidad',
    descripcion: 'Rojo y verde con nieve cayendo.',
    mensaje: '¡Felices fiestas! Regalá salud y bienestar · Delivery a domicilio',
    colores: ['#c8102e', '#1f8a4c', '#ffffff'],
  },
  halloween: {
    nombre: 'Halloween',
    descripcion: 'Naranja y violeta con fantasmas flotando.',
    mensaje: 'Ofertas de miedo 🎃 · Delivery a domicilio y retiro en sucursal',
    colores: ['#ea580c', '#7c3aed', '#1c1129'],
  },
  cyberday: {
    nombre: 'Cyberday',
    descripcion: 'Violeta eléctrico con cinta de ofertas.',
    mensaje: 'CYBERDAY · Los mejores descuentos online en Farmashop',
    colores: ['#7c3aed', '#06b6d4', '#0b0a1a'],
  },
};

export const LISTA_TEMAS = Object.entries(TEMAS).map(([id, t]) => ({ id, ...t }));
