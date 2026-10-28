// Datos de la tienda. Todo lo marcado con TODO debe completarse con los datos reales.

export const TIENDA = {
  nombre: 'Farmashop',
  razonSocial: 'Sankor S.A.',
  ruc: '', // TODO: RUC de la empresa
  whatsapp: '595986703000',
  whatsappVisible: '0986 703 000',
  email: 'contacto@treekings.com.py',
  instagram: 'https://www.instagram.com/farmashop.paraguay/',
  facebook: 'https://www.facebook.com/Farmashop.paraguay/?locale=es_LA',
  leyComercio: 'Sitio web comercial adaptado a la Ley No. 4864/18 Decreto No. 1165', // TODO: verificar número de ley (la de comercio electrónico es la 4868/13)
};

// Debe coincidir con DELIVERY_COSTO del servidor (el servidor es quien lo cobra)
export const COSTO_DELIVERY = 15000;

export const SUCURSALES = [
  { id: 1, nombre: 'Casa Matriz', direccion: 'Hohenau', horario: 'Lun a Sáb 7:00 – 21:00', coords: { lat: -27.083312, lng: -55.649169 } },
  { id: 2, nombre: 'Farmashop Sucursal 1', direccion: 'Hohenau', horario: 'Lun a Sáb 7:00 – 21:00', coords: { lat: -27.079504, lng: -55.645760 } },
  { id: 3, nombre: 'Farmashop Hohenau Centro', direccion: 'Hohenau', horario: 'Lun a Sáb 7:00 – 21:00', coords: { lat: -27.083315, lng: -55.649176 } },
  { id: 4, nombre: 'Farmashop Obligado', direccion: 'Obligado', horario: 'Lun a Sáb 7:00 – 21:00', coords: { lat: -27.055854, lng: -55.628102 } },
];

export const CIUDADES_DELIVERY = ['Hohenau', 'Obligado', 'Bella Vista', 'Capitán Miranda', 'Trinidad', 'Encarnación'];

export const DATOS_BANCARIOS = {
  titular: '', // TODO: titular de la cuenta
  ruc: '', // TODO
  banco: '', // TODO
  cuenta: '', // TODO
  alias: '', // TODO: alias SIPAP, si tiene
};

// TODO: imagen del QR de cobro (colocar el archivo en client/public/qr-pago.png)
export const QR_PAGO = '/qr-pago.png';

export const METODOS_PAGO = [
  { id: 'transferencia', titulo: 'Transferencia bancaria', detalle: 'Te mostramos los datos al confirmar' },
  { id: 'qr', titulo: 'Pago con QR', detalle: 'Escaneá con la app de tu banco' },
  { id: 'contra_entrega', titulo: 'Pago al recibir / retirar', detalle: 'Efectivo o POS con tarjeta' },
];

// ---------------------------------------------------------------
// Departamentos: agrupan las categorías (tipos de producto) del ERP.
// Se asignan por nombre exacto de la categoría (en mayúsculas).
// Las categorías no listadas van a "Otros"; las de OCULTAS no se muestran.
// ---------------------------------------------------------------
export const CATEGORIAS_OCULTAS = [
  'USO INTERNO', 'PROBADORES', 'SERVICIOS', 'MEDICAMENTO SOLIDARIO', 'EROTICOS',
  'A.J. BOSTON', 'BRIGHT STAR S.A', 'EL SENA  S.A.C IMPORTACIONES', 'GALERIA GUARANI', 'SANDRA CAROLINA',
];

export const DEPARTAMENTOS = [
  {
    slug: 'medicamentos', nombre: 'Medicamentos', icono: 'Pill', color: 'brand',
    categorias: ['MEDICAMENTOS', 'ANTIGRIPALES', 'MEDICAMENTOS COLESTEROL', 'MEDICAMENTOS DIABETICOS',
      'MEDICAMENTOS DIURETICOS', 'MEDICAMENTOS HIPERTENSIVOS', 'INSULINAS', 'MED. FITOTERAPEUTICOS',
      'MEDICAMENTOS ANTICONCEPTIVOS', 'ANTICONCEPTIVOS'],
  },
  {
    slug: 'vitaminas', nombre: 'Vitaminas y nutrición', icono: 'Apple', color: 'leaf',
    categorias: ['VITAMINAS', 'VITAMINAS GARDEN HOUSE', 'LECHES', 'ALIMENTOS', 'COMESTIBLE', 'YERBAS', 'AGUA', 'AGUA GENERAL', 'GASEOSA'],
  },
  {
    slug: 'dermocosmetica', nombre: 'Dermocosmética', icono: 'Sparkles', color: 'sky',
    categorias: ['CREMAS FACIALES', 'LIMPIADORES FACIALES', 'TONICOS FACIALES', 'MASCARILLAS', 'PHARMACARE',
      'BLOQUEADORES', 'BRONCEADORES', 'CREMAS CORPORALES', 'CREMAS REDUCTORAS', 'EXFOLIANTE CORPORAL', 'ACEITE CORPORAL'],
  },
  {
    slug: 'maquillaje', nombre: 'Maquillaje', icono: 'Palette', color: 'brand',
    categorias: ['BASES Y CORRECTORES', 'LABIALES', 'MAQUILLAJE CEJAS Y OJOS', 'MAQUILLAJES EN GRAL', 'RUBORES',
      'POLVOS', 'ILUMINADORES & CONTORNOS', 'FIJADORES DE MAQUILLAJE', 'ESTUCHE DE MAQUILLAJES', 'ESMALTES',
      'QUITAESMALTES', 'COSMETICOS', 'PERFILADO'],
  },
  {
    slug: 'cuidado-personal', nombre: 'Cuidado personal', icono: 'Droplets', color: 'sky',
    categorias: ['ASEO PERSONAL', 'DESODORANTES', 'JABON CORPORAL', 'CEPILLO DENTAL', 'CUIDADO INTIMO', 'LAVADOS',
      'TOALLAS FEMININAS', 'ESPUMAS DE AFEITAR', 'CREMAS DEPILATORIAS', 'TALCO', 'PAPEL HIGIENICO', 'PAÑUELITOS', 'TOALLA DE PAPEL'],
  },
  {
    slug: 'cabello', nombre: 'Cuidado capilar', icono: 'Wind', color: 'leaf',
    categorias: ['SHAMPOOS', 'ACONDICIONADOR', 'TRATAMIENTOS CAPILARES', 'ACEITE CAPILAR', 'GEL PARA CABELLO', 'TINTURAS', 'CAPILATIS'],
  },
  {
    slug: 'bebes', nombre: 'Bebés y maternidad', icono: 'Baby', color: 'sky',
    categorias: ['PAÑALES', 'ASEO DE BEBE', 'JABON PARA BEBE', 'PERFUME P/BEBE', 'VASITOS'],
  },
  {
    slug: 'perfumeria', nombre: 'Perfumería', icono: 'Flower2', color: 'brand',
    categorias: ['PERFUMES', 'PERFUMES ECONOMICOS', 'COLONIAS'],
  },
  {
    slug: 'salud', nombre: 'Salud y botiquín', icono: 'HeartPulse', color: 'leaf',
    categorias: ['BOTIQUIN', 'HOSPITALARIOS', 'NEBULIZADOR', 'PRESERVATIVOS', 'LUBRICANTES', 'REPELENTES', 'MEDIAS'],
  },
  {
    slug: 'otros', nombre: 'Regalos y más', icono: 'Gift', color: 'ink',
    categorias: [], // recibe el resto
  },
];
