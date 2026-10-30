import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BadgePercent, ChevronDown, ChevronRight, Heart, Home, LayoutGrid, MapPin, Menu, MessageCircle, Search, ShoppingBag, Truck } from 'lucide-react';
import CartDrawer from '../Components/CartView';
import Footer from '../Components/Footer';
import FloatingBubble from '../Components/FloatingBubble';
import SearchBox from '../Components/SearchBox';
import DepartamentoIcono from '../Components/DepartamentoIcono';
import Drawer from '../ui/Drawer';
import { cn } from '../lib/cn';
import { whatsappUrl } from '../lib/texto';
import useCategorias from '../hooks/useCategorias';
import { selectCantidadTotal, setShowCart } from '../redux/cartSlice';
import { TIENDA } from '../config/tienda';
import logoImg from '../assets/farmaShop/cropped-Farmashop-astra-180-x-60.png';

const urlDepartamento = (d) => `/catalogo?depto=${d.slug}`;
const urlCategoria = (c) => `/catalogo?categoria=${c.id}`;

function BarraSuperior() {
  return (
    <div className="bg-ink-900 text-[13px] text-white/85">
      <div className="container-page flex h-9 items-center justify-between gap-4">
        <p className="flex items-center gap-2 truncate">
          <Truck className="h-4 w-4 shrink-0 text-leaf-500" />
          <span className="truncate">Delivery a domicilio y retiro gratis en sucursal</span>
        </p>
        <div className="hidden items-center gap-5 sm:flex">
          <Link to="/sucursales" className="flex items-center gap-1.5 hover:text-white">
            <MapPin className="h-3.5 w-3.5" /> Sucursales
          </Link>
          <a href={whatsappUrl(TIENDA.whatsapp, 'Hola, les escribo desde la web de Farmashop!')} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white">
            <MessageCircle className="h-3.5 w-3.5" /> {TIENDA.whatsappVisible}
          </a>
        </div>
      </div>
    </div>
  );
}

// Menú de departamentos con panel desplegable de subcategorías (desktop)
function MenuCategorias({ departamentos }) {
  const [abierto, setAbierto] = useState(null);
  const timer = useRef();
  const location = useLocation();

  useEffect(() => setAbierto(null), [location]);

  const abrir = (slug) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAbierto(slug), 120);
  };
  const cerrar = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAbierto(null), 150);
  };

  const actual = departamentos.find((d) => d.slug === abierto);

  return (
    <nav className="relative hidden border-t border-ink-100 lg:block" onMouseLeave={cerrar}>
      <ul className="container-page scrollbar-none flex h-12 items-center justify-between gap-0.5 overflow-x-auto">
        <li onMouseEnter={cerrar}>
          <Link
            to="/ofertas"
            className="flex h-9 items-center gap-1.5 rounded-full bg-brand-500 px-3 text-[13px] font-semibold whitespace-nowrap text-white transition hover:bg-brand-600 xl:text-sm"
          >
            <BadgePercent className="h-4 w-4" /> Ofertas
          </Link>
        </li>
        {departamentos.map((d) => (
          <li key={d.slug} onMouseEnter={() => abrir(d.slug)}>
            <Link
              to={urlDepartamento(d)}
              className={cn(
                'flex h-9 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium xl:px-3 xl:text-sm whitespace-nowrap text-ink-700 transition hover:bg-brand-50 hover:text-brand-700',
                abierto === d.slug && 'bg-brand-50 text-brand-700'
              )}
            >
              {d.nombre}
              <ChevronDown className={cn('h-3.5 w-3.5 opacity-50 transition', abierto === d.slug && 'rotate-180')} />
            </Link>
          </li>
        ))}
      </ul>

      {actual && (
        <div
          onMouseEnter={() => clearTimeout(timer.current)}
          className="absolute inset-x-0 top-full z-40 border-t border-ink-100 bg-white shadow-pop animate-fade-in"
        >
          <div className="container-page flex gap-10 py-8">
            <div className="w-64 shrink-0">
              <DepartamentoIcono departamento={actual} className="h-14 w-14" iconClassName="h-7 w-7" />
              <h3 className="mt-4 text-xl font-bold">{actual.nombre}</h3>
              <Link to={urlDepartamento(actual)} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2 transition-all">
                Ver todo <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="grid flex-1 grid-cols-3 content-start gap-x-8 gap-y-1">
              {actual.categorias.map((c) => (
                <li key={c.id}>
                  <Link to={urlCategoria(c)} className="block rounded-lg px-2 py-1.5 text-sm text-ink-600 transition hover:bg-ink-50 hover:text-brand-600">
                    {c.nombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}

// Menú lateral para mobile con acordeón simple por departamento
function MenuMobile({ open, onOpenChange, departamentos }) {
  const [expandido, setExpandido] = useState(null);
  const navigate = useNavigate();
  const ir = (url) => {
    onOpenChange(false);
    navigate(url);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="left" title="Categorías" className="max-w-sm">
      <ul className="p-3">
        <li>
          <button
            type="button"
            onClick={() => ir('/ofertas')}
            className="mb-1 flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-brand-50 p-2.5 text-left font-semibold text-brand-700"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-500 text-white"><BadgePercent className="h-5 w-5" /></span>
            Ofertas
          </button>
        </li>
        {departamentos.map((d) => (
          <li key={d.slug}>
            <button
              type="button"
              onClick={() => setExpandido(expandido === d.slug ? null : d.slug)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2.5 text-left font-medium text-ink-800 hover:bg-ink-50"
            >
              <DepartamentoIcono departamento={d} className="h-10 w-10" />
              <span className="flex-1">{d.nombre}</span>
              <ChevronDown className={cn('h-4 w-4 text-ink-400 transition', expandido === d.slug && 'rotate-180')} />
            </button>
            {expandido === d.slug && (
              <ul className="mb-2 ml-[3.25rem] border-l border-ink-100 pl-3">
                <li>
                  <button type="button" onClick={() => ir(urlDepartamento(d))} className="w-full cursor-pointer py-2 text-left text-sm font-semibold text-brand-600">
                    Ver todo
                  </button>
                </li>
                {d.categorias.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => ir(urlCategoria(c))} className="w-full cursor-pointer py-2 text-left text-sm text-ink-600">
                      {c.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </Drawer>
  );
}

function BotonIcono({ onClick, to, label, children, badge }) {
  const clases = 'relative grid h-11 w-11 cursor-pointer place-items-center rounded-full text-ink-700 transition hover:bg-ink-100 hover:text-brand-600';
  const contenido = (
    <>
      {children}
      {badge > 0 && (
        <span className="absolute top-0.5 right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </>
  );
  return to
    ? <Link to={to} className={clases} aria-label={label}>{contenido}</Link>
    : <button type="button" onClick={onClick} className={clases} aria-label={label}>{contenido}</button>;
}

function NavegacionInferior({ onCategorias, onBuscar }) {
  const dispatch = useDispatch();
  const cantidad = useSelector(selectCantidadTotal);
  const item = 'flex flex-1 cursor-pointer flex-col items-center gap-0.5 py-2 text-[11px] font-medium';
  const activo = ({ isActive }) => cn(item, isActive ? 'text-brand-600' : 'text-ink-500');

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <NavLink to="/home" className={activo}><Home className="h-5 w-5" />Inicio</NavLink>
      <button type="button" onClick={onCategorias} className={cn(item, 'text-ink-500')}><LayoutGrid className="h-5 w-5" />Categorías</button>
      <button type="button" onClick={onBuscar} className={cn(item, 'text-ink-500')}><Search className="h-5 w-5" />Buscar</button>
      <NavLink to="/favoritos" className={activo}><Heart className="h-5 w-5" />Favoritos</NavLink>
      <button type="button" onClick={() => dispatch(setShowCart(true))} className={cn(item, 'relative text-ink-500')}>
        <ShoppingBag className="h-5 w-5" />Carrito
        {cantidad > 0 && (
          <span className="absolute top-1 left-1/2 ml-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {cantidad}
          </span>
        )}
      </button>
    </nav>
  );
}

export default function MainLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const cantidad = useSelector(selectCantidadTotal);
  const favoritos = useSelector((state) => state.favoritos.items.length);
  const { departamentos } = useCategorias();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [buscadorMobile, setBuscadorMobile] = useState(false);
  const [conScroll, setConScroll] = useState(false);

  useEffect(() => {
    const onScroll = () => setConScroll(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Volver arriba al cambiar de página
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setBuscadorMobile(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <BarraSuperior />

      <header className={cn(
        'sticky top-0 z-40 bg-white/90 backdrop-blur-lg transition-shadow',
        conScroll ? 'shadow-[0_8px_24px_-12px_rgb(22_26_36/0.18)]' : 'border-b border-ink-100'
      )}>
        <div className="container-page flex h-18 items-center gap-3 lg:h-20 lg:gap-8">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            className="-ml-2 grid h-11 w-11 cursor-pointer place-items-center rounded-full text-ink-700 hover:bg-ink-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/home" className="shrink-0" aria-label="Farmashop, ir al inicio">
            <img src={logoImg} alt="Farmashop" className="h-9 w-auto lg:h-11" />
          </Link>

          <SearchBox className="hidden flex-1 md:block lg:max-w-2xl" />

          <div className="ml-auto flex items-center gap-1">
            <span className="md:hidden">
              <BotonIcono onClick={() => setBuscadorMobile((v) => !v)} label="Buscar">
                <Search className="h-5.5 w-5.5" />
              </BotonIcono>
            </span>
            <span className="hidden sm:block">
              <BotonIcono to="/favoritos" label="Favoritos" badge={favoritos}>
                <Heart className="h-5.5 w-5.5" />
              </BotonIcono>
            </span>
            <BotonIcono onClick={() => dispatch(setShowCart(true))} label="Abrir carrito" badge={cantidad}>
              <ShoppingBag className="h-5.5 w-5.5" />
            </BotonIcono>
          </div>
        </div>

        {buscadorMobile && (
          <div className="container-page pb-3 md:hidden">
            <SearchBox autoFocus onNavigate={() => setBuscadorMobile(false)} />
          </div>
        )}

        <MenuCategorias departamentos={departamentos} />
      </header>

      <main className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>

      <Footer />

      <FloatingBubble phoneNumber={TIENDA.whatsapp} message="Hola, les escribo desde la web de Farmashop!" />
      <CartDrawer />
      <MenuMobile open={menuAbierto} onOpenChange={setMenuAbierto} departamentos={departamentos} />
      <NavegacionInferior onCategorias={() => setMenuAbierto(true)} onBuscar={() => { window.scrollTo({ top: 0 }); setBuscadorMobile(true); }} />
    </div>
  );
}
