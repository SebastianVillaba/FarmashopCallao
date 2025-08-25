import { useState, useRef, useEffect } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import imagenPrueba1 from '../assets/wixLogo.jpg';
import imagenPrueba2 from '../assets/baldwinLogo.png';
import imagenPrueba3 from '../assets/tridimLogo.jpeg';
import imagenPrueba4 from '../assets/parkerRacorLogo.png';

const imagenes = [
    { src: imagenPrueba1 },
    { src: imagenPrueba2 },
    { src: imagenPrueba3 },
    { src: imagenPrueba4 },
    { src: imagenPrueba1 },
    { src: imagenPrueba2 },
    { src: imagenPrueba3 },
    { src: imagenPrueba4 },
];

const CuadroImagenes = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsToShow, setItemsToShow] = useState(3);
    const [slideDirection, setSlideDirection] = useState('right');
    const containerRef = useRef(null);
    
    // Función para determinar cuántos elementos mostrar según el ancho de pantalla
    const updateItemsToShow = () => {
        const width = window.innerWidth;
        if (width < 600) return 1;
        if (width < 960) return 2;
        if (width < 1280) return 3;
        return 4;
    };

    useEffect(() => {
        setItemsToShow(updateItemsToShow());
        const handleResize = () => setItemsToShow(updateItemsToShow());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ajustar currentIndex cuando cambia itemsToShow
    useEffect(() => {
        const maxIndex = Math.max(0, imagenes.length - itemsToShow);
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [itemsToShow]);

    const nextSlide = () => {
        setSlideDirection('right');
        setCurrentIndex(prevIndex => 
            prevIndex >= imagenes.length - itemsToShow ? 0 : prevIndex + 1
        );
    };

    const prevSlide = () => {
        setSlideDirection('left');
        setCurrentIndex(prevIndex => 
            prevIndex === 0 ? imagenes.length - itemsToShow : prevIndex - 1
        );
    };

    return (
        <Box sx={{ 
            py: 8, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            position: 'relative',
            width: '100%',
            overflow: 'hidden'
        }}>
            <Typography variant="h2" sx={{ 
              textAlign: 'center', 
              mb: 3,
              fontSize: { xs: '2rem', sm: '2rem', md: '2.0rem' },
              fontWeight: 700,
              color: '#d4459f',
              position: 'relative',
              paddingTop: '20px',
              '&:after': {
                content: '""',
                display: 'block',
                width: '50%',
                height: '4px',
                background: 'linear-gradient(90deg, #ff8e9e, #5ecfff, #a78bfa)',
                position: 'absolute',
                bottom: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '2px'
              }
            }}>
                Promociones
            </Typography>
            
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '1350px',
                position: 'relative'
            }}>
                <IconButton
                    onClick={prevSlide}
                    sx={{
                        position: 'absolute',
                        left: { xs: 0, sm: 8, md: 16 },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.9)'
                        }
                    }}
                >
                    <ArrowBackIosIcon sx={{ color: '#d45fa7' }} />
                </IconButton>

                {/* Contenedor principal con overflow oculto */}
                <Box ref={containerRef} sx={{
                    width: '100%',
                    overflow: 'hidden',
                }}>
                    {/* Contenedor animado */}
                    <Box sx={{
                        display: 'flex',
                        transition: 'transform 0.5s ease-in-out',
                        transform: `translateX(${-currentIndex * (100 / itemsToShow)}%)`,
                    }}>
                        {imagenes.map((imagen, index) => (
                            <Box key={index} sx={{
                                flex: `0 0 ${100 / itemsToShow}%`,
                                boxSizing: 'border-box',
                                p: 1,
                            }}>
                                <Box sx={{
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    width: '100%',
                                    height: { xs: 150, sm: 180, md: 200 },
                                    transition: 'transform 0.3s',
                                    '&:hover': {
                                        transform: 'scale(1.03)'
                                    }
                                }}>
                                    <Box
                                        component="img"
                                        src={imagen.src}
                                        alt="Imagen de promoción"
                                        sx={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>

                <IconButton
                    onClick={nextSlide}
                    sx={{
                        position: 'absolute',
                        right: { xs: 0, sm: 8, md: 16 },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.9)'
                        }
                    }}
                >
                    <ArrowForwardIosIcon sx={{ color: '#d45fa7' }} />
                </IconButton>
            </Box>
        </Box>
    );
};

export default CuadroImagenes;