// "CREMAS FACIALES" -> "Cremas faciales"
export const capitalizar = (texto = '') => {
  const limpio = String(texto).trim().toLowerCase();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

// "IBUPROFENO 400MG X 10 COMP.," -> "Ibuprofeno 400 mg x 10 Comp."
export const nombreProducto = (texto = '') =>
  String(texto)
    .trim()
    .replace(/[,\s]+$/, '')
    .replace(/,(?=\S)/g, ', ')
    .toLowerCase()
    .replace(/(^|[\s(/+-])(\p{L})/gu, (_, sep, letra) => sep + letra.toUpperCase())
    .replace(/(\d)\s?(mg|ml|gr|g|mcg|ui|cc)\b/gi, (_, n, u) => `${n} ${u.toLowerCase()}`)
    .replace(/\sX(?=\s|\d)/g, ' x');

export const whatsappUrl = (telefono, mensaje = '') =>
  `https://wa.me/${String(telefono).replace(/[^\d]/g, '')}?text=${encodeURIComponent(mensaje)}`;
