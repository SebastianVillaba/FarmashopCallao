import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgePercent } from 'lucide-react';
import CustomBreadcrumbs from '../Components/CustomBreadCrumb';
import BotonesDescuento from '../Components/BotonesDescuento';
import { GrillaProductos } from '../Components/TarjetaProducto';
import { buttonClasses } from '../ui/Button';
import { Card, EmptyState } from '../ui/misc';
import { api } from '../lib/api';
import { rangoDescuento } from '../lib/descuentos';

export default function OfertasPage() {
  const [params] = useSearchParams();
  const rango = rangoDescuento(params.get('descuento'));
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Con ?descuento=20 se listan los productos de ese rango; sin filtro, las ofertas vigentes del ERP
  useEffect(() => {
    setCargando(true);
    const pedido = rango
      ? api.get('/productos/descuentos', { params: { rango: rango.id, limit: 300 } })
      : api.get('/productos/ofertas', { params: { limit: 100 } });
    pedido
      .then(({ data }) => setProductos(data.respuesta || []))
      .catch(() => setProductos([]))
      .finally(() => setCargando(false));
  }, [rango?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const titulo = rango ? rango.titulo : 'Ofertas';

  return (
    <div className="container-page pt-6">
      <title>{`${titulo} · Farmashop`}</title>
      <CustomBreadcrumbs items={rango ? [{ label: 'Ofertas', to: '/ofertas' }, { label: rango.label }] : [{ label: 'Ofertas' }]} />
      <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{titulo}</h1>
      <p className="mt-1 mb-6 text-ink-500">
        {rango
          ? `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'} con precio rebajado, hasta agotar stock.`
          : 'Precios especiales por tiempo limitado, hasta agotar stock.'}
      </p>

      <BotonesDescuento activo={rango?.id} className="mb-8" />

      {!cargando && productos.length === 0 ? (
        <Card>
          <EmptyState icon={BadgePercent} title={rango ? 'No hay productos en este rango' : 'No hay ofertas vigentes'} action={<Link to="/catalogo" className={buttonClasses()}>Ver catálogo</Link>}>
            Volvé pronto: publicamos nuevas promociones todas las semanas.
          </EmptyState>
        </Card>
      ) : (
        <GrillaProductos productos={productos} cargando={cargando} />
      )}
    </div>
  );
}
