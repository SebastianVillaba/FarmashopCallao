import { Link, Navigate, useLocation } from 'react-router-dom';
import { Heart, PackageCheck, Zap } from 'lucide-react';
import { useCuenta } from '../../context/CuentaContext';

// Sólo rutas internas: evita redirecciones abiertas con ?volver=https://...
export const destinoSeguro = (valor, porDefecto = '/cuenta') =>
  typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') && !valor.startsWith('/\\') ? valor : porDefecto;

export const BENEFICIOS = [
  { icono: Zap, titulo: 'Comprá en segundos', texto: 'Tus datos y tu dirección se completan solos en el checkout.' },
  { icono: Heart, titulo: 'Favoritos en todos lados', texto: 'Guardá productos y encontralos desde el celu o la compu.' },
  { icono: PackageCheck, titulo: 'Tus pedidos a mano', texto: 'Revisá el estado y el historial de todas tus compras.' },
];

// Pantalla de ingreso / registro: beneficios a la izquierda, formulario a la derecha
export function PantallaAuth({ titulo, subtitulo, children, pie }) {
  return (
    <div className="container-page py-8 lg:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-ink-100 bg-white shadow-card lg:grid-cols-[1fr_1.15fr]">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-10 text-white lg:block">
          <span aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
          <span aria-hidden className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-sm font-semibold tracking-wider text-white/70 uppercase">Mi cuenta Farmashop</p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-extrabold">Tu farmacia, siempre a mano.</h2>
            <ul className="mt-10 space-y-7">
              {BENEFICIOS.map(({ icono: Icono, titulo: t, texto }) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                    <Icono className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold">{t}</span>
                    <span className="block text-sm text-white/80">{texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{titulo}</h1>
          {subtitulo && <p className="mt-1.5 text-sm text-ink-500">{subtitulo}</p>}
          <div className="mt-7">{children}</div>
          {pie && <div className="mt-7 border-t border-ink-100 pt-6 text-center text-sm text-ink-600">{pie}</div>}
        </section>
      </div>
    </div>
  );
}

export function EnlaceAuth({ to, children }) {
  return <Link to={to} className="font-semibold text-brand-600 hover:underline">{children}</Link>;
}

export function AlertaError({ children }) {
  if (!children) return null;
  return <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{children}</p>;
}

export function CargandoCuenta() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" />
    </div>
  );
}

// Envuelve páginas que requieren sesión
export function RequiereCuenta({ children }) {
  const { cliente, cargando } = useCuenta();
  const location = useLocation();
  if (cargando) return <CargandoCuenta />;
  if (!cliente) return <Navigate to={`/cuenta/ingresar?volver=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

// Si ya hay sesión, ingreso/registro no tienen sentido
export function SoloInvitado({ children }) {
  const { cliente, cargando } = useCuenta();
  const location = useLocation();
  if (cargando) return <CargandoCuenta />;
  if (cliente) return <Navigate to={destinoSeguro(new URLSearchParams(location.search).get('volver'))} replace />;
  return children;
}
