// HomePage.jsx
import { useState } from "react";
import { Box, Container } from "@mui/material";
import HomeImageSlider from "../Components/HomeImageSlider";
import IntroduccionEmpresa from "../Components/IntroduccionEmpresa";
import AdvertiseMain from "../Components/AdvertiseMain";
import ProductosDestacados from "../Components/ProductosDestacados";
import CuadrosImagenes from "../Components/CuadrosImagenes"
import DiscountHome from "../Components/DiscountHome";
import ComprarCategoria from "../Components/ComprarCategoria";

const productosOferta = [
    {
        codigo: "404303",
        idProducto: 259,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX NOCHE",
        precio: 431200
    },
    {
        codigo: "404304",
        idProducto: 260,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX DIA",
        precio: 431200
    },
    {
        codigo: "404305",
        idProducto: 261,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX TARDE",
        precio: 431200
    },
    {
        codigo: "404306",
        idProducto: 262,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX NOCHE PLUS",
        precio: 431200
    },
    {
        codigo: "404307",
        idProducto: 263,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX DIA PLUS",
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
        <CuadrosImagenes/>
        <ProductosDestacados
          titulo={'Productos en oferta'}
          productos={productosOferta}
        />
        <ComprarCategoria />
    </Box>
  );
};

export default HomePage;