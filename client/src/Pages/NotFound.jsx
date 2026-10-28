import { Link } from 'react-router-dom';
import { buttonClasses } from '../ui/Button';
import logoImg from '../assets/farmaShop/cropped-Farmashop-astra-180-x-60.png';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-sky-50 px-6 text-center">
      <title>Página no encontrada · Farmashop</title>
      <img src={logoImg} alt="Farmashop" className="mb-10 h-10 w-auto" />
      <p className="font-display text-8xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 max-w-sm text-ink-500">Puede que el enlace esté roto o que la página se haya movido.</p>
      <div className="mt-8 flex gap-3">
        <Link to="/home" className={buttonClasses()}>Ir al inicio</Link>
        <Link to="/catalogo" className={buttonClasses({ variant: 'outline' })}>Ver catálogo</Link>
      </div>
    </div>
  );
}
