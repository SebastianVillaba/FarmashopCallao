import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Input } from '../../ui/Field';
import { mensajeError } from '../../lib/api';
import { useCuenta } from '../../context/CuentaContext';
import { CampoPassword } from './IngresarPage';
import { AlertaError, EnlaceAuth, PantallaAuth, SoloInvitado } from './comun';

const requerido = (msg) => z.string().trim().min(1, msg);

const schema = z.object({
  nombre: requerido('Ingresá tu nombre').min(2, 'Nombre muy corto').max(100),
  apellido: requerido('Ingresá tu apellido').min(2, 'Apellido muy corto').max(100),
  email: requerido('Ingresá tu email').email('Email inválido').max(150),
  telefono: requerido('Ingresá tu celular').regex(/^[0-9+\s()-]{6,30}$/, 'Número inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(200),
  confirmar: z.string(),
  aceptaTerminos: z.literal(true, { errorMap: () => ({ message: 'Necesitamos que aceptes para crear la cuenta' }) }),
  aceptaComunicaciones: z.boolean(),
}).refine((d) => d.password === d.confirmar, { path: ['confirmar'], message: 'Las contraseñas no coinciden' });

function Casilla({ error, children, ...props }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-700">
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md accent-brand-500" {...props} />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1 ml-8 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function Formulario() {
  const { registro } = useCuenta();
  const [params] = useSearchParams();
  const [error, setError] = useState(null);
  const volver = params.get('volver');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      nombre: params.get('nombre') || '',
      apellido: params.get('apellido') || '',
      email: params.get('email') || '',
      telefono: params.get('telefono') || '',
      password: '',
      confirmar: '',
      aceptaTerminos: false,
      aceptaComunicaciones: false,
    },
  });

  const enviar = handleSubmit(async ({ confirmar: _c, ...datos }) => {
    setError(null);
    try {
      const cliente = await registro(datos);
      toast.success(`¡Bienvenido/a, ${cliente.nombre}!`, { description: 'Tu cuenta quedó creada.' });
    } catch (err) {
      setError(mensajeError(err, 'No pudimos crear tu cuenta'));
    }
  });

  const ingresar = `/cuenta/ingresar${volver ? `?volver=${encodeURIComponent(volver)}` : ''}`;

  return (
    <PantallaAuth
      titulo="Creá tu cuenta"
      subtitulo="Es gratis y te lleva menos de un minuto."
      pie={<>¿Ya tenés cuenta? <EnlaceAuth to={ingresar}>Ingresá</EnlaceAuth></>}
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" required autoComplete="given-name" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Apellido" required autoComplete="family-name" error={errors.apellido?.message} {...register('apellido')} />
        </div>
        <Input label="Email" required type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Celular"
          required
          type="tel"
          autoComplete="tel"
          placeholder="0981 123 456"
          hint="Te avisamos por WhatsApp el estado de tus pedidos."
          error={errors.telefono?.message}
          {...register('telefono')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoPassword autoComplete="new-password" required error={errors.password?.message} {...register('password')} />
          <CampoPassword label="Repetir contraseña" autoComplete="new-password" required error={errors.confirmar?.message} {...register('confirmar')} />
        </div>

        <div className="space-y-3 rounded-2xl bg-ink-50 p-4">
          <Casilla error={errors.aceptaTerminos?.message} {...register('aceptaTerminos')}>
            Acepto los <Link to="/terminos" target="_blank" className="font-semibold text-brand-600 hover:underline">términos y condiciones</Link> y
            la <Link to="/privacidad" target="_blank" className="font-semibold text-brand-600 hover:underline">política de privacidad</Link>.
          </Casilla>
          <Casilla {...register('aceptaComunicaciones')}>
            Quiero recibir ofertas y novedades de Farmashop por email y WhatsApp. <span className="text-ink-500">Podés darte de baja cuando quieras.</span>
          </Casilla>
        </div>

        <AlertaError>{error}</AlertaError>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />} Crear cuenta
        </Button>
      </form>
    </PantallaAuth>
  );
}

export default function RegistroPage() {
  return (
    <SoloInvitado>
      <title>Crear cuenta · Farmashop</title>
      <Formulario />
    </SoloInvitado>
  );
}
