import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { WhatsAppLogo } from './FloatingBubble';
import { whatsappUrl } from '../lib/texto';
import { TIENDA } from '../config/tienda';
import logoImg from '../assets/farmaShop/cropped-Logo-Farmashop-Horizontal-blanco.png';
import bancardImg from '../assets/pago-bancard.jpg';

const InstagramLogo = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

const FacebookLogo = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.87.24-1.46 1.49-1.46h1.6V4.46a21 21 0 0 0-2.33-.12c-2.3 0-3.88 1.4-3.88 3.98v2.18H7.8v3h2.6V21h3.1z" />
  </svg>
);

const COLUMNAS = [
  {
    titulo: 'Comprar',
    links: [
      { label: 'Catálogo', to: '/catalogo' },
      { label: 'Medicamentos', to: '/catalogo?depto=medicamentos' },
      { label: 'Dermocosmética', to: '/catalogo?depto=dermocosmetica' },
      { label: 'Mis favoritos', to: '/favoritos' },
    ],
  },
  {
    titulo: 'Ayuda',
    links: [
      { label: 'Seguí tu pedido', to: '/pedido' },
      { label: 'Sucursales', to: '/sucursales' },
      { label: 'Envíos y devoluciones', to: '/envios-y-devoluciones' },
      { label: 'Preguntas frecuentes', to: '/envios-y-devoluciones#preguntas' },
    ],
  },
  {
    titulo: 'Legal',
    links: [
      { label: 'Términos y condiciones', to: '/terminos' },
      { label: 'Política de privacidad', to: '/privacidad' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink-900 text-white/70">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-sm">
          <img src={logoImg} alt="Farmashop" className="h-9 w-auto" />
          <p className="mt-5 text-sm leading-relaxed">
            Tu farmacia de confianza. Medicamentos, dermocosmética y cuidado personal con retiro en sucursal o delivery.
          </p>
          <a
            href={whatsappUrl(TIENDA.whatsapp, 'Hola, les escribo desde la web de Farmashop!')}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white/5 py-3 pr-5 pl-3 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#25d366] text-white">
              <WhatsAppLogo className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs">Escribinos o llamanos</span>
              <span className="block font-display font-bold text-white">{TIENDA.whatsappVisible}</span>
            </span>
          </a>
          <div className="mt-6 flex gap-2">
            <a href={TIENDA.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full bg-white/5 transition hover:bg-brand-500 hover:text-white">
              <InstagramLogo className="h-5 w-5" />
            </a>
            <a href={TIENDA.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full bg-white/5 transition hover:bg-sky-500 hover:text-white">
              <FacebookLogo className="h-5 w-5" />
            </a>
            {TIENDA.email && (
              <a href={`mailto:${TIENDA.email}`} aria-label="Email" className="grid h-10 w-10 place-items-center rounded-full bg-white/5 transition hover:bg-white/20 hover:text-white">
                <Mail className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNAS.map((col) => (
            <div key={col.titulo}>
              <h4 className="font-display text-sm font-bold tracking-wide text-white uppercase">{col.titulo}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} className="text-sm transition hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 text-xs sm:flex-row">
          <div className="text-center sm:text-left">
            <p>© {new Date().getFullYear()} {TIENDA.razonSocial}. Todos los derechos reservados.</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-white/50 sm:justify-start">
              <MapPin className="h-3 w-3" /> {TIENDA.leyComercio}
            </p>
            <p className="mt-1 text-white/50">
              Desarrollado por <span className="font-semibold text-white/70">Treekings S.A.</span> ·{' '}
              <a href={`mailto:${TIENDA.email}`} className="transition hover:text-white">{TIENDA.email}</a>
            </p>
          </div>
          <img src={bancardImg} alt="Medios de pago aceptados" className="h-8 w-auto rounded-md bg-white p-1" />
        </div>
      </div>
    </footer>
  );
}
