import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import CustomBreadcrumbs from "../Components/CustomBreadCrumb.jsx";
import SideCategorias from "../Components/SideCategorias.jsx";
import TarjetaProducto from "../Components/TarjetaProducto.jsx";
import { useEffect, useState } from "react";
import CustomPagination from "../Components/CustomPagination.jsx";
import { useDispatch, useSelector } from "react-redux";
import { buscarProductos, limpiarBusqueda } from "../redux/searchSlice";
import { setCategoriaSeleccionada } from '../redux/utilsSlice';


const CatalogoPage = () => {
  // Obtener datos de búsqueda del estado global
  const { resultados, palabra, estado, error, categoria, tipoBusqueda } = useSelector(state => state.busqueda);
  
  // Estados locales para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const dispatch = useDispatch();

  const categoriaSeleccionada = useSelector(state => state.utilitarios.categoriaSeleccionada);


  useEffect(() => {
    // Limpiar búsqueda al desmontar el componente
    return () => {
      dispatch(limpiarBusqueda());
      dispatch(setCategoriaSeleccionada(''));
    };
  }, [dispatch]);

  // Calcular productos paginados
  const getProductosPaginados = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return resultados.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(resultados.length / itemsPerPage);

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ margin: 5 }}>
        <CustomBreadcrumbs />
      </Box>
      
      <Box sx={{ display: "flex", flexDirection: { xs: 'column', md: 'row' }, gap: 2.5 }}>
        <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0, mb: { xs: 2, md: 0 }}}>
          <SideCategorias />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ color: '#d35fa7' }}>
              {palabra ? `Resultados para: "${palabra}"` : 'Catálogo de productos'}
            </Typography>
            <Divider sx={{ margin: 2, bgcolor: '#D4459F' }}/>
            
            {estado === 'cargando' ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : estado === 'error' ? (
              <Typography color="error" sx={{ mt: 2 }}>
                {error || "Error al cargar los productos"}
              </Typography>
            ) : resultados.length === 0 ? (
              <Typography sx={{ mt: 2 }}>
                {palabra ? "No se encontraron productos" : "Cargando productos..."}
              </Typography>
            ) : (
              <>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 2,
                  mt: 2
                }}>
                  {getProductosPaginados().map((producto) => (
                    <TarjetaProducto 
                      key={producto.idProducto}
                      producto={producto}
                    />
                  ))}
                </Box>
                <CustomPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </Box>
      </Box>
    </Box>
  );
};

export default CatalogoPage;