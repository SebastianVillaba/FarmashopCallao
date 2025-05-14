import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import CustomBreadcrumbs from "../Components/CustomBreadCrumb.jsx";
import SideCategorias from "../Components/SideCategorias.jsx";
import TarjetaProducto from "../Components/TarjetaProducto.jsx";
import { useEffect, useState } from "react";
import axios from "axios";
import CustomPagination from "../Components/CustomPagination.jsx";

const productoOfflie = [
  {
    nombreMercaderia: 'cania de pesca',
    precio: 2.86,
    idProducto: 5478
  }
]

const CatalogoPage = () => {
  // Estados locales
  const [productos, setProductos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Puedes hacerlo configurable
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  // Función para obtener productos
  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/productos/getProductos", {
        params: { palabra: "hilo" }
      });
      
      const data = response.data.respuesta || [];
      setProductos(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setError(null);
    } catch (error) {
      setError("Error al cargar los productos");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    console.log(productos);
  }, [productos])

  // Calcular productos paginados
  const getProductosPaginados = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return productos.slice(startIndex, endIndex);
  };

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ margin: 5 }}>
        <CustomBreadcrumbs />
      </Box>
      
      <Box sx={{ display: "flex", gap: 2.5 }}>
        <SideCategorias />
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">Catálogo de productos</Typography>
          <Divider sx={{ margin: 2 }}/>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
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

            </>
          )}
        </Box>
      </Box>
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
    </Box>
  );
};

export default CatalogoPage;