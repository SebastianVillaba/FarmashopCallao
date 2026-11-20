import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Heart, UserRound } from 'lucide-react';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import { GrillaProductos } from '../Components/TarjetaProducto';
import { buttonClasses } from '../ui/Button';
import { Card, EmptyState } from '../ui/misc';
import { useCuenta } from '../context/CuentaContext';

export default function FavoritosPage() {
  const favoritos = useSelector((state) => state.favoritos.items);
  const { cliente, cargando } = useCuenta();

  return (
    <div className="container-page pt-6">
      <title>Mis favoritos · Farmashop</title>
      <CustomBreadcrumbs items={[{ label: 'Favoritos' }]} />
      <h1 className="mt-5 mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Mis favoritos</h1>

      {!cargando && !cliente && (
        <div className="mb-6 flex flex-col items-start gap-3 rounded-3xl bg-brand-50 p-5 sm:flex-row sm:items-center">
          <UserRound className="h-6 w-6 shrink-0 text-brand-500" />
          <p className="flex-1 text-sm text-ink-700">
            <strong className="text-ink-900">Tus favoritos están guardados sólo en este navegador.</strong> Ingresá para tenerlos en todos tus dispositivos.
          </p>
          <Link to="/cuenta/ingresar?volver=/favoritos" className={buttonClasses({ size: 'sm' })}>Ingresar</Link>
        </div>
      )}

      {favoritos.length === 0 ? (
        <Card>
          <EmptyState icon={Heart} title="Todavía no guardaste favoritos" action={<Link to="/catalogo" className={buttonClasses()}>Explorar productos</Link>}>
            Tocá el corazón en cualquier producto para guardarlo acá.
          </EmptyState>
        </Card>
      ) : (
        <GrillaProductos productos={favoritos} />
      )}
    </div>
  );
}
