import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Heart } from 'lucide-react';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import { GrillaProductos } from '../Components/TarjetaProducto';
import { buttonClasses } from '../ui/Button';
import { Card, EmptyState } from '../ui/misc';

export default function FavoritosPage() {
  const favoritos = useSelector((state) => state.favoritos.items);

  return (
    <div className="container-page pt-6">
      <title>Mis favoritos · Farmashop</title>
      <CustomBreadcrumbs items={[{ label: 'Favoritos' }]} />
      <h1 className="mt-5 mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Mis favoritos</h1>

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
