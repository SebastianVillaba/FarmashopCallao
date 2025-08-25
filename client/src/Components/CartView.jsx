import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Container,
    Button
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useDispatch, useSelector } from 'react-redux';
import { deleteProductoCarrito } from '../redux/cartSlice';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';

const CartView = ({ hideActions = false }) => {

    const cartData = useSelector(state => state.carrito.cartData);
    const navigate = useNavigate()
    return (
        <Box>
            <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: '1fr',
                    md: '1fr'
                },
                gap: 2,
                p: 2
            }}>
                {
                    cartData.length === 0 ? (
                        <Typography variant='h7' fontWeight='500' color='black' sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            m: 2
                        }}>
                            No tienes productos en el carrito!
                        </Typography>
                    ) : (    
                    cartData.map((producto) => (
                        <CartProduct 
                            key={producto.idProducto} 
                            producto={producto}
                        />
                    )))
                }
            </Box>
            {!hideActions && (
                <>
                    <Box sx={{
                        p: 2,
                        borderTop: '2px solid #D5DAE0',
                        display: "flex",
                        justifyContent: { xs: 'space-between', sm: 'center' },
                        alignItems: "center"
                    }}>
                        <Typography variant='subtitle1' fontWeight='500' color='black'>
                            Subtotal: {formatCurrency(cartData.reduce((acc, item) => acc + (item.precio * item.cantidad), 0))}
                        </Typography>
                    </Box>
                    <Box sx={{
                        p: 2,
                        borderTop: '2px solid #D5DAE0',
                        display: "flex",
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: "center",
                        alignItems: "stretch",
                        gap: 1.5
                    }}>
                        <Button 
                            fullWidth
                            sx={{
                                border: "1.5px solid rgba(0, 0, 0, 0.5)",
                                borderRadius: 20,
                                color: 'rgba(0, 0, 0, 0.7)'
                            }}
                            onClick={() => navigate('/cart')}
                        >
                            Ver el carrito
                        </Button>
                        <Button 
                            variant='contained'
                            fullWidth
                            sx={{
        
                                borderRadius: 20,
                                backgroundColor: "#D4459F",
                                color: "rgba(255, 255, 255, 1)"
                            }}
                            onClick={() => navigate('/checkout')}
                        >
                            Comprar YA!
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};

const CartProduct = ({ producto }) => {

    const dispatch = useDispatch();

    return (
        <Box sx={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            m: 1
        }}>
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    m: 1
                }} 
            >
                <ClearIcon 
                    sx={{
                        color: 'black',
                        fontSize: '18px',
                        right: 12,
                        cursor: 'pointer',
                        mb: 2
                    }}
                    onClick={() => dispatch(deleteProductoCarrito(producto.idProducto))}
                />
                <Box
                    component="img"
                    height={80}
                    src={producto.caniaImage}
                    alt={producto.nombreMercaderia}
                    sx={{ 
                        objectFit: 'contain',
                        width: 80,
                        mr: 2 
                    }}
                />
                <Box sx={{ marginBottom: '12px', color: "black"}}>
                    <Typography variant='body1' sx={{ textAlign: 'left' }}>
                        {producto.nombreMercaderia}
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                        {producto.cantidad} x {formatCurrency(producto.precio)} 
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default CartView;