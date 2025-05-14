import { Box, Typography, Grid } from "@mui/material";
import imagenPrueba1 from '../assets/wixLogo.jpg';
import imagenPrueba2 from '../assets/baldwinLogo.png';
import imagenPrueba3 from '../assets/tridimLogo.jpeg';
import imagenPrueba4 from '../assets/parkerRacorLogo.png';

const imagenes = [
    imagenPrueba1,
    imagenPrueba2,
    imagenPrueba3,
    imagenPrueba4
];

const CuadroIndividual = ({ imagen }) => {
    return (
        <Grid item xs={12} sm={6} md={6}>
            <Box 
                component="img"
                src={imagen}
                alt="Imagen de promoción"
                sx={{
                    width: '100%',
                    maxWidth: 440,
                    height: 280,
                    borderRadius: '10%',
                    border: '3.5px solid #FDCD05',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                        transform: 'scale(1.05)'
                    }
                }}
            />
        </Grid>
    );
};

const CuadroImagenes = ({ titulo }) => {
    return (
        <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/*<Typography variant="h5" sx={{
                mb: 6,
                fontWeight: 500,
                color: '#666666',
                fontSize: { xs: '1.5rem', md: '2rem' }
            }}>
                {titulo}
            </Typography> */} {/* AQUI PODRIA IR EL TITULO */}
            
            <Grid container spacing={{ xs: 2, md: 4 }} sx={{
                maxWidth: 1200,
                margin: '0 auto',
            }}>
                {imagenes.map((imagen, index) => (
                    <CuadroIndividual key={index} imagen={imagen} />
                ))}
            </Grid>
        </Box>
    );
};

export default CuadroImagenes;