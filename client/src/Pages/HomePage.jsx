// HomePage.jsx
import { useState } from "react";
import { Box, Container } from "@mui/material";
import HomeImageSlider from "../Components/HomeImageSlider";
import IntroduccionEmpresa from "../Components/IntroduccionEmpresa";
import AdvertiseMain from "../Components/AdvertiseMain";
import ProductosDestacados from "../Components/ProductosDestacados";
import CuadrosImagenes from "../Components/CuadrosImagenes"
import DiscountHome from "../Components/DiscountHome";

const productosOferta = [
    {
        codigo: "404303",
        idProducto: 259,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "WIX FILTRO DE AIRE",
        precio: 431200
    },
    {
        codigo: "404304",
        idProducto: 260,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "WIX FILTRO DE ACEITE",
        precio: 431200
    },
    {
        codigo: "404305",
        idProducto: 261,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "WIX FILTRO DE COMBUSTIBLE",
        precio: 431200
    },
    {
        codigo: "404306",
        idProducto: 262,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "WIX FILTRO DE HIDRAULICO",
        precio: 431200
    },
    {
        codigo: "404307",
        idProducto: 263,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "WIX FILTRO DE AIRE",
        precio: 431200
    },
]

const descuentosDisp = [  
  "50%", "40%", "30%", "20%", "10%"
]

const HomePage = () => {
  const [showMainPopup, setShowMainPopup] = useState(true);
  const [showMiniWindow, setShowMiniWindow] = useState(false);

  const handleCloseMain = () => {
    setShowMainPopup(false);
    setShowMiniWindow(true); // Mostrar mini ventana al cerrar principal
  };

  const handleCloseMini = () => {
    setShowMiniWindow(false);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
        <AdvertiseMain
          openMain={showMainPopup}
          openMini={showMiniWindow}
          onCloseMain={handleCloseMain}
          onCloseMini={handleCloseMini}
        />
        <HomeImageSlider />
        <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'row', alignItems: 'center' }}>
          {
            descuentosDisp.map((descuento, index) => (
              <DiscountHome key={index} discount={descuento} />
            ))
          }
        </Box>
        <ProductosDestacados 
          titulo={'Productos Destacados'} 
          productos={productosOferta}
        />
        <Container>
            <CuadrosImagenes titulo={'Nuestras marcas'}/>
        </Container>
    </Box>
  );
};

export default HomePage;