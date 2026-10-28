import { z } from 'zod';

const requerido = (msg) => z.string().trim().min(1, msg);

export const checkoutSchema = z.object({
  // Paso 1: datos
  nombre: requerido('Ingresá tu nombre').min(2, 'Nombre muy corto').max(100),
  apellido: requerido('Ingresá tu apellido').min(2, 'Apellido muy corto').max(100),
  email: requerido('Ingresá tu email').email('Email inválido').max(150),
  telefono: requerido('Ingresá tu celular').regex(/^[0-9+\s()-]{6,30}$/, 'Número inválido'),
  documento: requerido('Ingresá tu cédula o RUC').regex(/^[0-9A-Za-z.-]{3,20}$/, 'Documento inválido'),
  dv: z.string().trim().max(2).optional(),
  razonSocial: z.string().trim().max(150).optional(),

  // Paso 2: entrega
  metodoEnvio: z.enum(['retiro', 'delivery']),
  idSucursal: z.string().optional(),
  calle: z.string().trim().max(150).optional(),
  calleSecundaria: z.string().trim().max(150).optional(),
  referencia: z.string().trim().max(250).optional(),
  ciudad: z.string().trim().max(100).optional(),
  observacion: z.string().trim().max(500).optional(),

  // Paso 3: pago
  metodoPago: z.enum(['transferencia', 'qr', 'contra_entrega'], { errorMap: () => ({ message: 'Elegí un método de pago' }) }),
}).superRefine((d, ctx) => {
  if (d.metodoEnvio === 'retiro' && !d.idSucursal) {
    ctx.addIssue({ code: 'custom', path: ['idSucursal'], message: 'Elegí una sucursal' });
  }
  if (d.metodoEnvio === 'delivery') {
    if (!d.calle || d.calle.length < 3) ctx.addIssue({ code: 'custom', path: ['calle'], message: 'Ingresá la dirección' });
    if (!d.ciudad) ctx.addIssue({ code: 'custom', path: ['ciudad'], message: 'Elegí la ciudad' });
  }
});

// Campos que se validan al avanzar desde cada paso
export const CAMPOS_POR_PASO = [
  ['nombre', 'apellido', 'email', 'telefono', 'documento', 'dv', 'razonSocial'],
  ['metodoEnvio', 'idSucursal', 'calle', 'ciudad', 'calleSecundaria', 'referencia', 'observacion'],
  ['metodoPago'],
];

// Formato que espera POST /api/pedidos
export const aPayload = (d, items) => ({
  cliente: { nombre: d.nombre, apellido: d.apellido, email: d.email, telefono: d.telefono },
  facturacion: { documento: d.documento, dv: d.dv || '', razonSocial: d.razonSocial || '' },
  envio: d.metodoEnvio === 'retiro'
    ? { metodo: 'retiro', idSucursal: Number(d.idSucursal), observacion: d.observacion || undefined }
    : {
      metodo: 'delivery',
      calle: d.calle,
      calleSecundaria: d.calleSecundaria || undefined,
      referencia: d.referencia || undefined,
      ciudad: d.ciudad,
      observacion: d.observacion || undefined,
    },
  metodoPago: d.metodoPago,
  items: items.map(({ idProducto, cantidad }) => ({ idProducto, cantidad })),
});
