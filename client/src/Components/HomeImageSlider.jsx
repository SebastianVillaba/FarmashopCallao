import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

// IMPORTACIONES DE LAS IMAGENES
import image1 from '../assets/farmaShop/Banner-Farmashop-Delivery.jpg'
import image2 from '../assets/farmaShop/Banner-web-agua-de-hamamelis.jpg'
import image3 from '../assets/farmaShop/Banner-web-serum-pharmacare.jpg'

const images = [ image1, image2, image3 ];

const HomeImageSlider = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Box sx={{
      position: 'relative',
      width: '100vw',
      height: { xs: '56.25vw', sm: '40vw', md: '30vw' }, 
      maxHeight: { xs: 400, md: 600 },
      left: '50%',
      transform: 'translateX(-50%)',
      overflow: 'hidden'
    }}>
      {/* Contenedor del slider */}
      <Box sx={{
        display: 'flex',
        height: '100%',
        transition: 'transform 0.5s ease-in-out', 
        transform: `translateX(-${currentImageIndex * 100}%)`,
      }}>
        {images.map((image, index) => (
          <Box
            key={index}
            component="img"
            src={image}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              flexShrink: 0
            }}
            alt={`Slide ${index + 1}`}
          />
        ))}
      </Box>

      {/* Botones de navegación (igual que antes) */}
      <IconButton
        onClick={handlePrev}
        sx={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0,0,0,0.3)',
          color: 'white',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' }
        }}
      >
        <ArrowBack fontSize="large" />
      </IconButton>

      <IconButton
        onClick={handleNext}
        sx={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(0,0,0,0.3)',
          color: 'white',
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' }
        }}
      >
        <ArrowForward fontSize="large" />
      </IconButton>
    </Box>
  );
};

export default HomeImageSlider;