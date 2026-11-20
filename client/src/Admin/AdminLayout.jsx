import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, Contact, ExternalLink, Image, KeyRound, LogOut, Menu, Package, Palette, ShoppingCart, Users, X } from 'lucide-react';
import DecoracionTema from '../Components/DecoracionTema';
import { cn } from '../lib/cn';
import { useConfig } from '../context/ConfigContext';
import { TEMAS } from '../config/temas';
import { useSesion } from './sesion';
import logoImg from '../assets/farmaShop/cropped-Farmashop-astra-180-x-60.png';

const SECCIONES = [
  { to: '/admin', end: true, label: 'Estadísticas', icono: BarChart3 },
  { to: '/admin/pedidos', label: 'Pedidos', icono: ShoppingCart },
  { to: '/admin/clientes', label: 'Clientes', icono: Contact },
  { to: '/admin/productos', label: 'Productos', icono: Package },
  { to: '/admin/banners', label: 'Banners', icono: Image },
  { to: '/admin/tematica', label: 'Temática', icono: Palette },
  { to: '/admin/usuarios', label: 'Usuarios', icono: Users, rol: 'admin' },
];

function Navegacion({ usuario, onNavegar }) {
  const { tema } = useConfig();
  const { logout } = useSesion();
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin" onClick={onNavegar} className="flex items-center gap-2 px-5 pt-6 pb-8">
        <img src={logoImg} alt="Farmashop" className="h-9 w-auto" />
        <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">Panel</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {SECCIONES.filter((s) => !s.rol || s.rol === usuario?.rol).map(({ to, end, label, icono: Icono }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavegar}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition',
              isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
            )}
          >
            <Icono className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-ink-100 p-3">
        <p className="px-3.5 pb-2 text-xs text-ink-500">
          Temática activa: <strong className="text-brand-600">{(TEMAS[tema] || TEMAS.default).nombre}</strong>
        </p>
        <a href="/home" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50">
          <ExternalLink className="h-4.5 w-4.5" /> Ver la tienda
        </a>
        <NavLink to="/admin/cuenta" onClick={onNavegar} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50">
          <KeyRound className="h-4.5 w-4.5" /> Cambiar contraseña
        </NavLink>
        <button type="button" onClick={logout} className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:bg-red-50 hover:text-red-700">
          <LogOut className="h-4.5 w-4.5" /> Cerrar sesión
        </button>
        <div className="mt-2 flex items-center gap-3 rounded-2xl bg-ink-50 px-3.5 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {(usuario?.nombre || '?').charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-semibold text-ink-900">{usuario?.nombre}</span>
            <span className="block text-xs text-ink-500">{usuario?.rol === 'admin' ? 'Administrador' : 'Editor'} · {usuario?.nick}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { usuario } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const location = useLocation();

  useEffect(() => setAbierto(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-ink-50">
      <DecoracionTema discreta />

      {/* Barra superior en mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-100 bg-white/95 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setAbierto(true)} aria-label="Abrir menú" className="-ml-2 grid h-10 w-10 cursor-pointer place-items-center rounded-full hover:bg-ink-100">
          <Menu className="h-5 w-5" />
        </button>
        <img src={logoImg} alt="Farmashop" className="h-7 w-auto" />
        <span className="w-10" />
      </header>

      {/* Menú lateral */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-ink-100 bg-white lg:block">
        <Navegacion usuario={usuario} />
      </aside>

      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-ink-900/40 animate-fade-in" onClick={() => setAbierto(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-pop animate-slide-in-left">
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar menú" className="absolute top-5 right-3 grid h-9 w-9 cursor-pointer place-items-center rounded-full hover:bg-ink-100">
              <X className="h-5 w-5" />
            </button>
            <Navegacion usuario={usuario} onNavegar={() => setAbierto(false)} />
          </aside>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
