import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../ui/Button';
import { Input } from '../../ui/Field';
import { mensajeError } from '../../lib/api';
import { TIENDA } from '../../config/tienda';
import { whatsappUrl } from '../../lib/texto';
import { cn } from '../../lib/cn';
import { useCuenta } from '../../context/CuentaContext';
import { AlertaError, EnlaceAuth, PantallaAuth, SoloInvitado } from './comun';

export function CampoPassword({ label = 'Contraseña', className, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={cn('relative', className)}>
      <Input label={label} type={visible ? 'text' : 'password'} inputClassName="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-[32px] right-2 grid h-9 w-9 cursor-pointer place-items-center rounded-full text-ink-500 hover:bg-ink-100"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}

function Formulario() {
  const { login } = useCuenta();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const volver = params.get('volver');

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const cliente = await login(email.trim(), password);
      // SoloInvitado redirige a "volver" al detectar la sesión
      toast.success(`¡Hola, ${cliente.nombre}!`);
    } catch (err) {
      setError(mensajeError(err, 'No pudimos iniciar sesión'));
      setPassword('');
      setEnviando(false);
    }
  };

  const registro = `/cuenta/registro${volver ? `?volver=${encodeURIComponent(volver)}` : ''}`;

  return (
    <PantallaAuth
      titulo="Ingresá a tu cuenta"
      subtitulo="Con tu cuenta tus datos se completan solos al comprar."
      pie={<>¿No tenés cuenta? <EnlaceAuth to={registro}>Creá una gratis</EnlaceAuth></>}
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={150} />
        <CampoPassword autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <AlertaError>{error}</AlertaError>
        <Button type="submit" size="lg" className="w-full" disabled={enviando || !email || !password}>
          {enviando && <Loader2 className="h-5 w-5 animate-spin" />} Ingresar
        </Button>
        <p className="text-center text-sm text-ink-500">
          ¿Olvidaste tu contraseña?{' '}
          <a
            href={whatsappUrl(TIENDA.whatsapp, `Hola! Olvidé la contraseña de mi cuenta en la web${email ? ` (${email.trim()})` : ''}.`)}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-600 hover:underline"
          >
            Escribinos por WhatsApp
          </a>
        </p>
      </form>
    </PantallaAuth>
  );
}

export default function IngresarPage() {
  return (
    <SoloInvitado>
      <title>Ingresar · Farmashop</title>
      <Formulario />
    </SoloInvitado>
  );
}
