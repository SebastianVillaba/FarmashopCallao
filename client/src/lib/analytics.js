// analytics.js
// Medición de la tienda: analítica propia (/api/t, alimenta el panel) + Google Analytics 4 (opcional, con consentimiento).
// La sesión dura 30 minutos de inactividad; una visita con UTM nuevos abre otra sesión.

const SESION_MS = 30 * 60 * 1000;
const FLUSH_MS = 5000;
const CLAVE_VISITANTE = 'fs_vid';
const CLAVE_SESION = 'fs_sid';
export const CLAVE_CONSENTIMIENTO = 'fs_cookies';

const leer = (clave) => { try { return localStorage.getItem(clave); } catch { return null; } };
const guardar = (clave, valor) => { try { localStorage.setItem(clave, valor); } catch { /* sin storage */ } };

// randomUUID sólo existe en contextos seguros (HTTPS / localhost)
const uuid = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const esAdmin = () => window.location.pathname.startsWith('/admin');

let visitanteId = null;
let sesion = null;          // { id, ultimo }
let datosSesionNueva = null; // se envían sólo con el primer lote de la sesión
let cola = [];
let timer = null;

const datosEntrada = () => {
  const p = new URLSearchParams(window.location.search);
  const d = {
    landing: window.location.pathname + window.location.search,
    referrer: document.referrer || undefined,
    utmSource: p.get('utm_source') || undefined,
    utmMedium: p.get('utm_medium') || undefined,
    utmCampaign: p.get('utm_campaign') || undefined,
    gclid: p.get('gclid') || undefined,
    fbclid: p.get('fbclid') || undefined,
  };
  return Object.fromEntries(Object.entries(d).filter(([, v]) => v).map(([k, v]) => [k, String(v).slice(0, 300)]));
};

const asegurarSesion = () => {
  visitanteId ??= leer(CLAVE_VISITANTE) || (() => { const id = uuid(); guardar(CLAVE_VISITANTE, id); return id; })();

  if (!sesion) {
    try { sesion = JSON.parse(leer(CLAVE_SESION)); } catch { sesion = null; }
  }
  const ahora = Date.now();
  const traeCampania = /[?&](utm_source|gclid|fbclid)=/.test(window.location.search);
  if (!sesion?.id || ahora - sesion.ultimo > SESION_MS || (traeCampania && !datosSesionNueva && sesion.landing !== window.location.search)) {
    sesion = { id: uuid(), ultimo: ahora, landing: window.location.search };
    datosSesionNueva = datosEntrada();
  }
  sesion.ultimo = ahora;
  guardar(CLAVE_SESION, JSON.stringify(sesion));
  return sesion.id;
};

export const getIdSesion = () => (esAdmin() ? undefined : asegurarSesion());

const enviar = () => {
  clearTimeout(timer);
  timer = null;
  if (!cola.length || !sesion) return;
  const lote = { visitanteId, idSesion: sesion.id, eventos: cola.splice(0, 30) };
  if (datosSesionNueva) {
    lote.sesion = datosSesionNueva;
    datosSesionNueva = null;
  }
  const cuerpo = JSON.stringify(lote);
  const ok = navigator.sendBeacon?.('/api/t', new Blob([cuerpo], { type: 'text/plain' }));
  if (!ok) fetch('/api/t', { method: 'POST', body: cuerpo, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(() => {});
  if (cola.length) enviar();
};

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && enviar());
  window.addEventListener('pagehide', enviar);
}

// ---------------- Google Analytics 4 ----------------

let ga4Id = null;
let ga4Cargado = false;

export const consentimiento = () => leer(CLAVE_CONSENTIMIENTO); // 'si' | 'no' | null

const cargarGa4 = () => {
  if (ga4Cargado || !ga4Id || consentimiento() !== 'si' || esAdmin()) return;
  ga4Cargado = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', ga4Id, { send_page_view: false, currency: 'PYG' });
};

export const configurarGa4 = (id) => {
  ga4Id = id || null;
  cargarGa4();
};

export const setConsentimiento = (valor) => {
  guardar(CLAVE_CONSENTIMIENTO, valor);
  cargarGa4();
};

const ga = (...args) => ga4Cargado && window.gtag?.(...args);

const itemGa = (p, cantidad = 1) => ({
  item_id: String(p.codigo ?? p.idProducto),
  item_name: p.nombreMercaderia,
  item_brand: p.nombreLab,
  price: p.precio,
  quantity: cantidad,
});

// ---------------- API pública ----------------

const track = (evento) => {
  if (esAdmin()) return;
  asegurarSesion();
  cola.push(evento);
  if (cola.length >= 20) enviar();
  else timer ??= setTimeout(enviar, FLUSH_MS);
};

export const trackPagina = (ruta) => {
  track({ tipo: 'page_view', ruta });
  ga('event', 'page_view', { page_path: ruta, page_location: window.location.href, page_title: document.title });
};

export const trackVerProducto = (p) => {
  track({ tipo: 'view_item', idProducto: p.idProducto, ruta: window.location.pathname, valor: p.precio });
  ga('event', 'view_item', { currency: 'PYG', value: p.precio, items: [itemGa(p)] });
};

export const trackBusqueda = (termino, resultados) => {
  const t = String(termino || '').trim().toLowerCase();
  if (t.length < 3) return;
  track({ tipo: 'search', termino: t.slice(0, 100), resultados });
  ga('event', 'search', { search_term: t });
};

export const trackAgregarCarrito = (p, cantidad = 1) => {
  track({ tipo: 'add_to_cart', idProducto: p.idProducto, valor: Math.round((p.precio || 0) * cantidad) });
  ga('event', 'add_to_cart', { currency: 'PYG', value: (p.precio || 0) * cantidad, items: [itemGa(p, cantidad)] });
};

export const trackInicioCheckout = (items, total) => {
  track({ tipo: 'begin_checkout', valor: Math.round(total) });
  ga('event', 'begin_checkout', { currency: 'PYG', value: total, items: items.map((i) => itemGa(i, i.cantidad)) });
};

// La compra se registra en el servidor al crear el pedido (con idSesion); acá sólo se avisa a GA4
export const trackCompra = (nroPedido, total, items = []) => {
  enviar();
  ga('event', 'purchase', {
    transaction_id: nroPedido,
    currency: 'PYG',
    value: total,
    items: items.map((i) => itemGa({ codigo: i.codigo, idProducto: i.idProducto, nombreMercaderia: i.nombre, precio: i.precioUnitario }, i.cantidad)),
  });
};
