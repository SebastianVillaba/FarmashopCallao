import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent } from 'lucide-react';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import { GrillaProductos } from '../Components/TarjetaProducto';
import { buttonClasses } from '../ui/Button';
import { Card, EmptyState } from '../ui/misc';
import { api } from '../lib/api';

export default function OfertasPage() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/productos/ofertas', { params: { limit: 100 } })
      .then(({ data }) => setProductos(data.respuesta || []))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="container-page pt-6">
      <title>Ofertas · Farmashop</title>
      <CustomBreadcrumbs items={[{ label: 'Ofertas' }]} />
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Ofertas</h1>
      <p className="mt-1 mb-6 text-ink-500">Precios especiales por tiempo limitado, hasta agotar stock.</p>

      {!cargando && productos.length === 0 ? (
        <Card>
          <EmptyState icon={BadgePercent} title="No hay ofertas vigentes" action={<Link to="/catalogo" className={buttonClasses()}>Ver catálogo</Link>}>
            Volvé pronto: publicamos nuevas promociones todas las semanas.
          </EmptyState>
        </Card>
      ) : (
        <GrillaProductos productos={productos} cargando={cargando} />
      )}
    </div>
  );
}
