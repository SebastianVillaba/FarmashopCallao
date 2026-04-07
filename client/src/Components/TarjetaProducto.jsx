import { Button, Card, CardActions, CardContent, CardMedia, Collapse, Fade, Typography } from "@mui/material";
import caniaImage from '../assets/430495.webp';
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addProductoCarrito } from "../redux/cartSlice";
import { useNavigate } from "react-router-dom";
import SelectorCantidad from "./SelectorCantidad";

const TarjetaProducto = ({ producto }) => {

    // useDispatch de redux
    const dispatch = useDispatch();

    // hooks react-router-dom
    const navigate = useNavigate();

    // Funcion para navegar al detalle del producto
    const handleVerDetalle = (productId, productSlug) => {
      navigate(`/detalle/${productId}/${productSlug}`)
    };

    // useState hook
    const [isOver, setIsOver] = useState(false);

    return (
        <Card
            sx={{ 
                position: 'relative', 
                width: '100%', 
                transition: '0.3s',
                '&:hover': { 
                    transform: 'translateY(-5px)',
                    cursor: 'pointer'
                },
                borderRadius: '20px'
            }}
            onMouseOver={() => setIsOver(true)}
            onMouseOut={() => setIsOver(false)}
        >
            <CardMedia 
                component="img"
                height={250}
                image={caniaImage}
                alt="Caña de pescar"
                sx={{ objectFit: 'contain' }}
                onClick={()=> handleVerDetalle(producto.idProducto, producto.slug)}
            />
            <CardContent
                onClick={()=> handleVerDetalle(producto.idProducto, producto.slug)}
                sx={{ marginBottom: "12px" }}
            >
                <Typography variant="h6" sx={{ 
                    display: "flex",
                    justifyContent: "center",
                    my: 1,
                    fontWeight: 'bold'
                }}>
                    {producto.precio.toLocaleString('es-ES')} ₲
                </Typography>
                <Typography 
                    gutterBottom 
                    variant="body1" 
                    component="div"
                    sx={{ 
                        textAlign: 'center',
                        minHeight: '4em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}
                >
                    {producto.nombreMercaderia}
                </Typography>
            </CardContent>
            
            {isOver && (
                <CardActions sx={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    py: 1,
                }}>
                    <Fade orientation="horizontal" in={isOver}>
    <Button 
        fullWidth
        sx={{
            border: "1.5px solid #d4459f",
            borderRadius: 20,
            color: '#d4459f',
            transition: 'all 0.3s ease', // Transición base aplicada siempre
            '&:hover': {
                backgroundColor: '#ff6bc6',
                color: 'white',
                // Transiciones específicas para propiedades individuales (opcional)
                transition:{ 
                    backgroundColor: '0.5s ease',
                    color: '0.2s ease'
                }
            }
        }}
        onClick={() => dispatch(addProductoCarrito({ 
            ...producto,
            caniaImage,
            cantidad: 1
        }))}
    >
        Agregar al carrito
    </Button>
                    </Fade>
                </CardActions>
            )}
        </Card>
    );
};

export default TarjetaProducto;