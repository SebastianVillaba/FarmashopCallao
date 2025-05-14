import { Box, Typography } from "@mui/material"



const DiscountHome = ({ discount }) => {

    return (
        <>
            <Box sx={{
                backgroundColor: "#307FE0",
                width: '250px',
                mx: 2,
                my: 4,
                display: 'flex',
                justifyContent: 'center',
                borderRadius: '24px',
                '&:hover': {
                    transform: 'scale(1.08)',
                    transition: 'transform 0.3s ease',
                },
                cursor: 'pointer'
            }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    margin: "20px",
                    fontFamily: "Poetsen One, sans-serif", // Aplica la fuente
                    fontSize: "4.5rem", // Ajusta el tamaño según necesidad
                    letterSpacing: "2px", // Opcional: ajuste de espaciado
                    color: "#D4459F" 
                  }}>
                    {discount}
                </Typography>
            </Box>
        </>
    )
}

export default DiscountHome