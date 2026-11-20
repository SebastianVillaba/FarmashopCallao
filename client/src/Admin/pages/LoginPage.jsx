import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import Button from '../../ui/Button';
import { Input } from '../../ui/Field';
import { mensajeError } from '../../lib/api';
import DecoracionTema from '../../Components/DecoracionTema';
import { useSesion } from '../sesion';
import logoImg from '../../assets/farmaShop/cropped-Farmashop-astra-180-x-60.png';

export default function LoginPage() {
  const { usuario, login } = useSesion();
  const navigate = useNavigate();
  const location = useLocation();
  const [nick, setNick] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(location.state?.vencida ? 'Tu sesión venció, ingresá de nuevo.' : null);

  if (usuario) return <Navigate to={location.state?.desde || '/admin'} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await login(nick.trim(), password);
      navigate(location.state?.desde || '/admin', { replace: true });
    } catch (err) {
      setError(mensajeError(err, 'No se pudo iniciar sesión'));
      setPassword('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-sky-50 px-4">
      <title>Ingresar · Panel Farmashop</title>
      <div className="absolute inset-x-0 top-0"><DecoracionTema discreta /></div>
      <div className="w-full max-w-sm rounded-3xl border border-ink-100 bg-white p-8 shadow-pop">
        <img src={logoImg} alt="Farmashop" className="mx-auto h-11 w-auto" />
        <h1 className="mt-6 text-center text-xl font-extrabold">Panel administrativo</h1>
        <p className="mt-1 text-center text-sm text-ink-500">Ingresá con tu usuario del sistema</p>

        <form onSubmit={enviar} className="mt-7 space-y-4">
          <Input label="Usuario" autoComplete="username" autoFocus value={nick} onChange={(e) => setNick(e.target.value)} required maxLength={20} />
          <Input label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={enviando || !nick || !password}>
            {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-4.5 w-4.5" />} Ingresar
          </Button>
        </form>
      </div>
      <p className="mt-6 text-xs text-ink-400">Acceso exclusivo para personal autorizado de Farmashop.</p>
    </div>
  );
}
