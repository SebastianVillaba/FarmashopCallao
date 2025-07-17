import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const categories = [
    {
      title: "Dermocosmética",
      color: "#FF8E9E",
      gradient: "linear-gradient(rgba(255, 142, 158, 0.4), rgba(255, 142, 158, 0.4))",
      src: "https://weformacion.com/wp-content/uploads/2024/09/young-beautiful-woman-getting-face-skin-treatment-spa.webp"
    },
    {
      title: "Higiene y Cuidado Del Bebé",
      color: "#5ECFFF",
      gradient: "linear-gradient(rgba(94, 207, 255, 0.4), rgba(94, 207, 255, 0.4))",
      src: "https://www.losconsejosdetumatrona.com/wp-content/uploads/2021/03/03-02-Cuidados-Higiene-1.jpg"
    },
    {
      title: "Perfumes y Fragancias",
      color: "#A78BFA",
      gradient: "linear-gradient(rgba(167, 139, 250, 0.4), rgba(167, 139, 250, 0.4))",
      src: "https://c.perfumesclub.com/BlogPFC/1392327931/img-cabecera.jpg"
    }
  ];

const ComprarCategoria = () => {
  const navigate = useNavigate();

  /* CUANDO HAYA CATEGORIAS EN CATALOGO PONER ESTO ASÍ
  const handleCategoryClick = (category) => {
    navigate(`/catalogo/${category.title.toLowerCase().replace(/\s+/g, '-')}`)
  } */

  const handleCategoryClick = () => {
    navigate('/catalogo');
  };

  return (
    <Container sx={{ 
      py: 8,
      maxWidth: '1300px',
      margin: '0 auto',
      px: { xs: 2, sm: 4, md: 6 }
    }}>
      <Typography variant="h2" sx={{ 
        textAlign: 'center', 
        mb: 6,
        fontSize: { xs: '1.2rem', sm: '1.6rem', md: '2.0rem' },
        fontWeight: 700,
        color: '#d4459f',
        position: 'relative',
        paddingTop: '20px',
        '&:after': {
          content: '""',
          display: 'block',
          width: '80px',
          height: '4px',
          background: 'linear-gradient(90deg, #ff8e9e, #5ecfff, #a78bfa)',
          position: 'absolute',
          bottom: '-15px',
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: '2px'
        }
      }}>
        Comprar por categoría
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 4,
        pb: 4
      }}>
        {categories.map((category, index) => (
          <Box 
            key={index}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              height: { xs: '280px', sm: '320px', md: '380px' },
              borderRadius: '16px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
              transition: 'all 0.5s cubic-bezier(0.25, 0.45, 0.45, 0.95)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
                '& .category-image': {
                  transform: 'scale(1.08)'
                },
                '& .category-content': {
                  transform: 'translateY(-15px)'
                }
              }
            }}
          >
            {/* Imagen de fondo con efecto de zoom */}
            <Box 
              className="category-image"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundImage: `${category.gradient}, url(${category.src})`,
                transition: 'transform 0.7s cubic-bezier(0.25, 0.45, 0.45, 0.95)',
              }}
            />
            
            {/* Contenido de texto */}
            <Box 
              className="category-content"
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                padding: '30px',
                color: 'white',
                zIndex: 2,
                transition: 'transform 0.5s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  mb: 2, 
                  fontSize: { xs: '1.6rem', md: '1.9rem' },
                  fontWeight: 700,
                  textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                  letterSpacing: '0.5px'
                }}
              >
                {category.title}
              </Typography>
              <Button 
                variant="contained" 
                sx={{
                  backgroundColor: category.color,
                  color: 'white',
                  fontWeight: 600,
                  padding: '10px 30px',
                  borderRadius: '30px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                  fontSize: '1.1rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: category.color,
                    transform: 'scale(1.08)',
                    boxShadow: '0 7px 20px rgba(0,0,0,0.4)'
                  }
                }}
                onClick={() => handleCategoryClick() /*() => handleCategoryClick(category.title) PARA CUANDO YA ESTE BIEN HECHO*/}
              >
                Ver catalogo
              </Button>
            </Box>
            
            {/* Overlay para mejorar legibilidad */}
            <Box sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '60%',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              zIndex: 1
            }} />
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default ComprarCategoria;