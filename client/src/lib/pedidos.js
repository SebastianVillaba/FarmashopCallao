// Estados del pedido tal como los ve el cliente
export const ESTADOS_PEDIDO = {
  pendiente: { label: 'Pendiente de pago', tone: 'brand' },
  confirmado: { label: 'Confirmado', tone: 'sky' },
  preparando: { label: 'En preparación', tone: 'sky' },
  enviado: { label: 'En camino', tone: 'leaf' },
  entregado: { label: 'Entregado', tone: 'leaf' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
};

export const urlPedido = (p) => `/pedido/${p.nroPedido}?email=${encodeURIComponent(p.email)}`;
