import { Box, Button, Container, Grid2, Typography, Divider } from "@mui/material";

import bancardImg from '../assets/pago-bancard.jpg'
import logoImg from '../assets/farmaShop/cropped-Farmashop-astra-180-x-60.png'
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';

const Footer = () => {

  const numeroCelular = "+595 986 703000"

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
                                        Lámanos desde tu celular o escribínos al Whatsapp:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WhatsAppIcon sx={{ color: '#25D366', fontSize: 35 }} />
                                        <Typography variant="h6">
                                            {numeroCelular}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <a href="https://www.instagram.com/farmashop.paraguay/" target="_blank" rel="noopener noreferrer">
                                            <InstagramIcon sx={{ 
                                                fontSize: 35,
                                                color: '#FE0464',
                                            }} />
                                        </a>
                                        <a href="https://www.facebook.com/Farmashop.paraguay/?locale=es_LA" target="_blank" rel="noopener noreferrer">
                                            <FacebookIcon sx={{ color: '#0866FF', fontSize: 35 }} />
                                        </a>
                                    </Box>
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