import { Box, Divider, Typography } from "@mui/material"
import TarjetaProducto from "./TarjetaProducto"


const ProductosDestacados = ({ titulo, productos }) => {
    return(
        <>
            <Box sx={{
                my: 2,
                mx: 12
            }}>
                <Typography variant="h5" sx={{
                    mb: 1,
                    fontWeight: 500,
                    color: '#666666'
                }}>
                    {titulo}
                </Typography>

                <Divider />
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    mt: 2,
                    
                }}>
                    {
                        productos.map((producto) => (
                            <TarjetaProducto 
                                key={producto.idProducto}
                                producto={producto}
                            />
                        ))
                    }
                </Box>
            </Box>
        </>
    )

}

export default ProductosDestacados