import { Box, Button, Container, Grid2, Typography, Divider } from "@mui/material";

import bancardImg from '../assets/pago-bancard.jpg'
import logoImg from '../assets/filpyhdsinfondo.png'

const Footer = () => {

  const numeroCelular = "+595 983 871004"

  return (
    <>
        <Divider sx={{ height: 2, width: '100%' }} />
        <Box sx={{ width: '100%', backgroundColor: '#ffffff' }}>

            <Container
                maxWidth={false}
                disableGutters
                sx={{
                    py: 4, 
                    width: '100%', 
                    px: { xs: 2, sm: 4 }
                }}
            >
                <Box sx={{
                    maxWidth: 1200,
                    mx: "auto"
                }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                    }}>

                        {/* Sección superior */}
                        <Grid2 container spacing={24} sx={{ mb: 4 }}>
                            {/* Columna 1 - Logo y contacto */}
                            <Grid2 item xs={12} md={4}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <img 
                                        src={logoImg}
                                        alt="Logo" 
                                        style={{ width: '200px', marginBottom: '1rem' }}
                                    />
                                    <Typography variant="body1" fontWeight="600">
                                        Lámanos desde tu celular:
                                    </Typography>
                                    <Button 
                                        variant="contained" 
                                        sx={{ 
                                            alignSelf: 'flex-start',
                                            backgroundColor: '#c14c49',
                                            '&:hover': { backgroundColor: '#a33c3a' }
                                        }}
                                    >
                                        Llamar ahora
                                    </Button>
                                    <Typography variant="body1">
                                        O escribinos al {numeroCelular}
                                    </Typography>
                                </Box>
                            </Grid2>

                            {/* Columna 2 - Institucional */}
                            <Grid2 item xs={6} md={4}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Institucional
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {['Responsabilidad Social', 'Blog', 'Contacto'].map((item) => (
                                        <Typography key={item} variant="body2" sx={{ cursor: 'pointer' }}>
                                            {item}
                                        </Typography>
                                    ))}
                                </Box>
                            </Grid2>

                                {/* Columna 3 - Atención al cliente */}
                            <Grid2 item xs={6} md={4}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Atención al cliente
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {['Sucursales', 'Términos y Condiciones', 'Métodos de pago', 'Preguntas frecuentes'].map((item) => (
                                    <Typography key={item} variant="body2" sx={{ cursor: 'pointer' }}>
                                        {item}
                                    </Typography>
                                    ))}
                                </Box>
                            </Grid2>
                        </Grid2>
                    </Box>
                    <Divider sx={{ my: 3 }} />
                    {/* Sección inferior */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        {/* Métodos de pago */}
                        <Box sx={{ display: 'flex', gap: 3 }}>
                            <img src={bancardImg} alt="Metodos de pago" />
                        </Box>

                        {/* Texto legal */}
                        <Typography variant="caption" textAlign="center" sx={{ maxWidth: 600 }}>
                            Sitio web comercial adaptado a la Ley No. 4864/18 Decreto No. 1165<br />
                            Encarnacion Pesca S.R.L
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    </>
  );
};

export default Footer;