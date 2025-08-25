import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import TarjetaProducto from "./TarjetaProducto";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const ProductosDestacados = ({ titulo, productos }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsToShow, setItemsToShow] = useState(1);
    const containerRef = useRef(null);
    const touchStartXRef = useRef(0);
    const touchDeltaXRef = useRef(0);

    const updateItemsToShow = () => {
        const width = window.innerWidth;
        if (width < 600) return 1; // móvil: solo 1
        if (width < 960) return 2; // tablets chicas
        if (width < 1280) return 3; // tablets grandes / laptop chica
        return 5; // desktop amplio
    }

    useEffect(() => {
        setItemsToShow(updateItemsToShow());
        const handleResize = () => setItemsToShow(updateItemsToShow());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const maxIndex = Math.max(0, productos.length - itemsToShow);
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [itemsToShow, productos.length, currentIndex]);

    const nextSlide = () => {
        const maxIndex = Math.max(0, productos.length - itemsToShow);
        setCurrentIndex(prevIndex => (prevIndex >= maxIndex ? 0 : prevIndex + 1));
    };

    const prevSlide = () => {
        const maxIndex = Math.max(0, productos.length - itemsToShow);
        setCurrentIndex(prevIndex => (prevIndex === 0 ? maxIndex : prevIndex - 1));
    };
    
    const showButtons = productos.length > itemsToShow && itemsToShow > 1;

    const handleTouchStart = (e) => {
        touchStartXRef.current = e.touches[0].clientX;
        touchDeltaXRef.current = 0;
    };

    const handleTouchMove = (e) => {
        touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    };

    const handleTouchEnd = () => {
        const threshold = 40; // píxeles para considerar swipe
        if (touchDeltaXRef.current > threshold) {
            prevSlide();
        } else if (touchDeltaXRef.current < -threshold) {
            nextSlide();
        }
        touchStartXRef.current = 0;
        touchDeltaXRef.current = 0;
    };

    return (
        <Box sx={{
            my: 4,
            mx: { xs: 2, md: 6, lg: 12 },
            position: 'relative',

            userSelect: 'none'
        }}>
            <Typography variant="h5" sx={{
                mb: 3,
                fontWeight: 500,
                color: '#d4459f',
                textAlign: { xs: 'center', md: 'left' }
            }}>
                {titulo}
            </Typography>

            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                position: 'relative' 
            }}>
                {showButtons && (
                    <IconButton
                        onClick={prevSlide}
                        sx={{
                            position: 'absolute',
                            left: { xs: -16, lg: -35 },
                            zIndex: 2,
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                        }}
                    >
                        <ArrowBackIosIcon sx={{ color: '#d45fa7' }} />
                    </IconButton>
                )}

                <Box
                    ref={containerRef}
                    sx={{ width: '100%', overflow: 'hidden' }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <Box sx={{
                        display: 'flex',
                        transition: 'transform 0.4s ease-in-out',
                        transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
                    }}>
                        {productos.map((producto) => (
                            <Box key={producto.idProducto} sx={{
                                flex: `0 0 ${100 / itemsToShow}%`,
                                boxSizing: 'border-box',
                                p: 1.5
                            }}>
                                <TarjetaProducto producto={producto} />
                            </Box>
                        ))}
                    </Box>
                </Box>

                {showButtons && (
                    <IconButton
                        onClick={nextSlide}
                        sx={{
                            position: 'absolute',
                            right: { xs: -16, lg: -35 },
                            zIndex: 2,
                            backgroundColor: 'rgba(255,255,255,0.7)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                        }}
                    >
                        <ArrowForwardIosIcon sx={{ color: '#d45fa7' }} />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
}

export default ProductosDestacados;