// Tonos sólidos de la marca: más intenso cuanto mayor el descuento (siguen la temática activa).
// Rangos de descuento (mismos ids que /api/productos/descuentos). El % es el redondeado de la etiqueta del producto.
export const RANGOS_DESCUENTO = [
  { id: '50mas', label: '+50%', titulo: 'Más del 50% de descuento', clases: 'bg-brand-800 shadow-brand-800/35' },
  { id: '50', label: '50%', titulo: '50% de descuento', clases: 'bg-brand-700 shadow-brand-700/35' },
  { id: '40', label: '40%', titulo: 'Del 40% al 49% de descuento', clases: 'bg-brand-600 shadow-brand-600/35' },
  { id: '30', label: '30%', titulo: 'Del 30% al 39% de descuento', clases: 'bg-brand-500 shadow-brand-500/35' },
  { id: '20', label: '20%', titulo: 'Del 20% al 29% de descuento', clases: 'bg-brand-400 shadow-brand-400/35' },
];

export const rangoDescuento = (id) => RANGOS_DESCUENTO.find((r) => r.id === id) || null;
