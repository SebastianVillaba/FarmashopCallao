import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, Heart, KeyRound, Loader2, LogOut, Mail, Package, ShoppingBag, Store, Truck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import CustomBreadcrumbs from '../../Components/CustomBreadCrumb';
import ProductImage from '../../Components/ProductImage';
import Button, { buttonClasses } from '../../ui/Button';
import { Input, Select } from '../../ui/Field';
import { Badge, Card, EmptyState, Skeleton } from '../../ui/misc';
import { api, mensajeError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { ESTADOS_PEDIDO, urlPedido } from '../../lib/pedidos';
import { formatCurrency } from '../../utils/formatCurrency';
import { CIUDADES_DELIVERY, SUCURSALES } from '../../config/tienda';
import { useCuenta } from '../../context/CuentaContext';
import { CampoPassword } from './IngresarPage';
import { RequiereCuenta } from './comun';

const SECCIONES = [
  { to: '/cuenta', end: true, label: 'Mis datos', icono: UserRound },
  { to: '/cuenta/pedidos', label: 'Mis pedidos', icono: Package },
  { to: '/favoritos', label: 'Favoritos', icono: Heart },
  { to: '/cuenta/seguridad', label: 'Email y contraseña', icono: KeyRound },
];

function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="border-t border-ink-100 pt-7 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold">{titulo}</h2>
      {descripcion && <p className="mt-0.5 mb-5 text-sm text-ink-500">{descripcion}</p>}
      {!descripcion && <div className="mb-5" />}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- Mis datos

const requerido = (msg) => z.string().trim().min(1, msg);

const perfilSchema = z.object({
  nombre: requerido('Ingresá tu nombre').min(2, 'Nombre muy corto').max(100),
  apellido: requerido('Ingresá tu apellido').min(2, 'Apellido muy corto').max(100),
  telefono: requerido('Ingresá tu celular').regex(/^[0-9+\s()-]{6,30}$/, 'Número inválido'),
  documento: z.string().trim().max(20).refine((v) => !v || /^[0-9A-Za-z.-]{3,20}$/.test(v), 'Documento inválido'),
  dv: z.string().trim().max(2),
  razonSocial: z.string().trim().max(150),
  metodoEnvio: z.enum(['', 'retiro', 'delivery']),
  idSucursal: z.string(),
  calle: z.string().trim().max(150),
  calleSecundaria: z.string().trim().max(150),
  referencia: z.string().trim().max(250),
  ciudad: z.string().trim().max(100),
  aceptaComunicaciones: z.boolean(),
});

const aFormulario = (c) => ({
  nombre: c.nombre || '',
  apellido: c.apellido || '',
  telefono: c.telefono || '',
  documento: c.documento || '',
  dv: c.dv || '',
  razonSocial: c.razonSocial || '',
  metodoEnvio: c.metodoEnvio || '',
  idSucursal: c.idSucursal ? String(c.idSucursal) : '',
  calle: c.calle || '',
  calleSecundaria: c.calleSecundaria || '',
  referencia: c.referencia || '',
  ciudad: c.ciudad || '',
  aceptaComunicaciones: Boolean(c.aceptaComunicaciones),
});

function OpcionEnvio({ value, icono: Icono, titulo, registrar }) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-ink-100 bg-white p-3.5 transition hover:border-ink-200 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/50">
      <input type="radio" value={value} {...registrar('metodoEnvio')} className="sr-only" />
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-100 text-ink-600 transition group-has-[:checked]:bg-brand-500 group-has-[:checked]:text-white">
        <Icono className="h-5 w-5" />
      </span>
      <span className="font-semibold text-ink-900">{titulo}</span>
    </label>
  );
}

function MisDatos() {
  const { cliente, setCliente } = useCuenta();
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(perfilSchema),
    mode: 'onTouched',
    defaultValues: aFormulario(cliente),
  });
  const metodo = useWatch({ control, name: 'metodoEnvio' });

  const guardar = handleSubmit(async (d) => {
    try {
      const { data } = await api.put('/cuenta/me', { ...d, metodoEnvio: d.metodoEnvio || null, idSucursal: d.idSucursal || null });
      setCliente(data.respuesta);
      reset(aFormulario(data.respuesta));
      toast.success('Datos guardados');
    } catch (err) {
      toast.error('No pudimos guardar', { description: mensajeError(err) });
    }
  });

  return (
    <Card className="p-5 sm:p-8">
      <form onSubmit={guardar} className="space-y-7" noValidate>
        <Seccion titulo="Datos personales" descripcion="Los usamos para coordinar tus pedidos.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre" required autoComplete="given-name" error={errors.nombre?.message} {...register('nombre')} />
            <Input label="Apellido" required autoComplete="family-name" error={errors.apellido?.message} {...register('apellido')} />
            <Input label="Celular" required type="tel" autoComplete="tel" error={errors.telefono?.message} {...register('telefono')} />
            <Input label="Email" value={cliente.email} disabled hint={<Link to="/cuenta/seguridad" className="font-semibold text-brand-600 hover:underline">Cambiar email</Link>} />
          </div>
        </Seccion>

        <Seccion titulo="Facturación" descripcion="Se completan automáticamente en el checkout.">
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Input label="Cédula o RUC" inputMode="numeric" error={errors.documento?.message} {...register('documento')} />
            <Input label="DV" maxLength={2} inputMode="numeric" hint="Sólo RUC" error={errors.dv?.message} {...register('dv')} />
            <Input label="Razón social" className="sm:col-span-2" hint="Opcional, si facturás a nombre de una empresa" error={errors.razonSocial?.message} {...register('razonSocial')} />
          </div>
        </Seccion>

        <Seccion titulo="Entrega preferida" descripcion="La elegimos por vos al comprar; siempre la podés cambiar.">
          <div className="grid gap-3 sm:grid-cols-2">
            <OpcionEnvio value="retiro" icono={Store} titulo="Retiro en sucursal" registrar={register} />
            <OpcionEnvio value="delivery" icono={Truck} titulo="Delivery" registrar={register} />
          </div>
          {metodo === 'retiro' && (
            <Select label="Sucursal" className="mt-4" {...register('idSucursal')}>
              <option value="">Elegí una sucursal</option>
              {SUCURSALES.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </Select>
          )}
          {metodo === 'delivery' && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Calle principal y número" className="sm:col-span-2" autoComplete="address-line1" error={errors.calle?.message} {...register('calle')} />
              <Input label="Entre / esquina" error={errors.calleSecundaria?.message} {...register('calleSecundaria')} />
              <Select label="Ciudad" {...register('ciudad')}>
                <option value="">Elegí la ciudad</option>
                {CIUDADES_DELIVERY.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Input label="Referencia" className="sm:col-span-2" placeholder="Ej: casa de rejas verdes, frente a la plaza" error={errors.referencia?.message} {...register('referencia')} />
            </div>
          )}
        </Seccion>

        <Seccion titulo="Comunicaciones">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-ink-50 p-4 text-sm text-ink-700">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-brand-500" {...register('aceptaComunicaciones')} />
            <span>
              <span className="block font-semibold text-ink-900">Quiero recibir ofertas y novedades</span>
              Por email y WhatsApp. Los avisos sobre tus pedidos te llegan siempre.
            </span>
          </label>
        </Seccion>

        <div className="flex justify-end border-t border-ink-100 pt-6">
          <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />} Guardar cambios
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------- Mis pedidos

function MisPedidos() {
  const [pedidos, setPedidos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/cuenta/pedidos')
      .then(({ data }) => setPedidos(data.respuesta))
      .catch((err) => setError(mensajeError(err)));
  }, []);

  if (error) return <Card className="p-8 text-center text-ink-500">{error}</Card>;
  if (!pedidos) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}</div>;
  if (!pedidos.length) {
    return (
      <Card>
        <EmptyState icon={ShoppingBag} title="Todavía no hiciste pedidos" action={<Link to="/catalogo" className={buttonClasses()}>Empezar a comprar</Link>}>
          Los pedidos que hagas con tu cuenta van a aparecer acá.
        </EmptyState>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {pedidos.map((p) => {
        const estado = ESTADOS_PEDIDO[p.estado] || ESTADOS_PEDIDO.pendiente;
        return (
          <li key={p.nroPedido}>
            <Link to={urlPedido(p)} className="group block">
              <Card className="flex items-center gap-4 p-4 transition group-hover:border-brand-200 group-hover:shadow-card-hover sm:p-5">
                <div className="flex shrink-0 -space-x-3">
                  {p.vistaPrevia.slice(0, 3).map((item, i) => (
                    <ProductImage key={i} src={item.imagen} alt="" className="h-14 w-14 rounded-xl border-2 border-white bg-white shadow-sm" />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-extrabold">{p.nroPedido}</p>
                    <Badge tone={estado.tone}>{estado.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {new Date(p.fecha).toLocaleDateString('es-PY', { dateStyle: 'medium' })} · {p.cantidadItems} {p.cantidadItems === 1 ? 'producto' : 'productos'} · {p.metodoEnvio === 'retiro' ? 'Retiro' : 'Delivery'}
                  </p>
                </div>
                <p className="hidden font-bold text-ink-900 sm:block">{formatCurrency(p.total)}</p>
                <ChevronRight className="h-5 w-5 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------- Seguridad

function CambiarEmail() {
  const { cliente, setCliente } = useCuenta();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const { data } = await api.put('/cuenta/me/email', { email: email.trim(), password });
      setCliente(data.respuesta);
      setEmail('');
      setPassword('');
      toast.success('Email actualizado');
    } catch (err) {
      toast.error('No pudimos cambiar el email', { description: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Seccion titulo="Email" descripcion={<>Tu email actual es <strong className="text-ink-800">{cliente.email}</strong>.</>}>
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <Input label="Nuevo email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={150} />
        <CampoPassword label="Tu contraseña" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="sm:col-span-2">
          <Button type="submit" variant="outline" disabled={enviando || !email || !password}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Cambiar email
          </Button>
        </div>
      </form>
    </Seccion>
  );
}

function CambiarPassword() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [enviando, setEnviando] = useState(false);
  const noCoinciden = repetir && nueva !== repetir;

  const enviar = async (e) => {
    e.preventDefault();
    if (nueva !== repetir) return;
    setEnviando(true);
    try {
      await api.put('/cuenta/me/password', { actual, nueva });
      setActual('');
      setNueva('');
      setRepetir('');
      toast.success('Contraseña actualizada', { description: 'Cerramos la sesión en tus otros dispositivos.' });
    } catch (err) {
      toast.error('No pudimos cambiar la contraseña', { description: mensajeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Seccion titulo="Contraseña" descripcion="Al cambiarla se cierra la sesión en tus otros dispositivos.">
      <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
        <CampoPassword label="Contraseña actual" autoComplete="current-password" className="sm:col-span-2" value={actual} onChange={(e) => setActual(e.target.value)} required />
        <CampoPassword label="Nueva contraseña" autoComplete="new-password" hint="Mínimo 8 caracteres" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={8} />
        <CampoPassword label="Repetir nueva contraseña" autoComplete="new-password" error={noCoinciden ? 'Las contraseñas no coinciden' : null} value={repetir} onChange={(e) => setRepetir(e.target.value)} required />
        <div className="sm:col-span-2">
          <Button type="submit" variant="outline" disabled={enviando || !actual || nueva.length < 8 || nueva !== repetir}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Cambiar contraseña
          </Button>
        </div>
      </form>
    </Seccion>
  );
}

function Seguridad() {
  return (
    <Card className="space-y-7 p-5 sm:p-8">
      <CambiarEmail />
      <CambiarPassword />
    </Card>
  );
}

// ---------------------------------------------------------------- Layout

function Navegacion() {
  const { logout } = useCuenta();
  const navigate = useNavigate();
  const favoritos = useSelector((state) => state.favoritos.items.length);

  const salir = async () => {
    await logout();
    toast.success('Cerraste sesión');
    navigate('/home', { replace: true });
  };

  const clases = ({ isActive }) => cn(
    'flex shrink-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
  );

  return (
    <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {SECCIONES.map(({ to, end, label, icono: Icono }) => (
        <NavLink key={to} to={to} end={end} className={clases}>
          <Icono className="h-4.5 w-4.5" /> {label}
          {to === '/favoritos' && favoritos > 0 && <span className="ml-auto rounded-full bg-ink-100 px-2 text-xs text-ink-600">{favoritos}</span>}
        </NavLink>
      ))}
      <button type="button" onClick={salir} className="flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap text-ink-500 transition hover:bg-red-50 hover:text-red-600 lg:mt-3 lg:border-t lg:border-ink-100 lg:pt-4">
        <LogOut className="h-4.5 w-4.5" /> Cerrar sesión
      </button>
    </nav>
  );
}

function Contenido() {
  const { cliente } = useCuenta();
  const iniciales = `${cliente.nombre?.[0] || ''}${cliente.apellido?.[0] || ''}`.toUpperCase();

  return (
    <div className="container-page pt-6">
      <title>Mi cuenta · Farmashop</title>
      <CustomBreadcrumbs items={[{ label: 'Mi cuenta' }]} />

      <div className="mt-5 mb-7 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-500 font-display text-xl font-extrabold text-white shadow-sm shadow-brand-500/30">{iniciales}</span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">Hola, {cliente.nombre}</h1>
          <p className="truncate text-sm text-ink-500">{cliente.email}</p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-28"><Navegacion /></aside>
        <div className="min-w-0">
          <Routes>
            <Route index element={<MisDatos />} />
            <Route path="pedidos" element={<MisPedidos />} />
            <Route path="seguridad" element={<Seguridad />} />
            <Route path="*" element={<Navigate to="/cuenta" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function CuentaPage() {
  return (
    <RequiereCuenta>
      <Contenido />
    </RequiereCuenta>
  );
}
