import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs, Typography, Link as MuiLink } from '@mui/material';

const CustomBreadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  // Mapeo de nombres más completo
  const nameMap = {
    catalogo: 'Catálogo',
    detalle: 'Detalle del Producto',
    cart: 'Carrito'
    // Agrega más mapeos según tus rutas
  };

  // Función para formatear el slug del producto
  const formatProductSlug = (slug) => {
    if (!slug) return '';
    return slug
      .replace(/-/g, ' ')
      .replace(/p\d+$/, '') // Elimina el código final tipo p21128
      .trim();
  };

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2, fontSize: '0.9rem' }}>
      <MuiLink sx={{ textDecoration: "none" }} component={Link} to="/" color="inherit">
        Inicio
      </MuiLink>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const decodedValue = decodeURIComponent(value);

        // Si es el segmento del producto (id + slug)
        if (decodedValue.includes('-')) {
          const productName = formatProductSlug(decodedValue.split('-').slice(0, -1).join('-'));
          return (
            <Typography color="text.primary" key={to}>
              {productName}
            </Typography>
          );
        }

        return last ? (
          <Typography color="text.primary" key={to}>
            {nameMap[decodedValue] || decodedValue}
          </Typography>
        ) : (
          <MuiLink component={Link} to={to} key={to} color="inherit">
            {nameMap[decodedValue] || decodedValue}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
};

export default CustomBreadcrumbs;