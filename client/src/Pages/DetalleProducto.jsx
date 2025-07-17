import { Box, Container, Divider, FormControl, IconButton, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Form, useNavigate, useParams } from "react-router-dom"
import CustomBreadcrumbs from "../Components/CustomBreadCrumb";
import { useEffect, useState } from "react";
import axios from 'axios'
import caniaImg from '../assets/filtroAceite.png'
import filtroImg from '../assets/filtroCombustible.jpg'
import DoneAllIcon from '@mui/icons-material/DoneAll';
import RemoveDoneIcon from '@mui/icons-material/RemoveDone';
import SelectorCantidad from "../Components/SelectorCantidad";
import { CenterFocusStrong, MoneyOffCsredSharp } from "@mui/icons-material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { formatCurrency } from "./CartPage";
import ProductosDestacados from "../Components/ProductosDestacados";

const productOffline = {
    nombreProducto: 'Cania de pescar',
    precio: 156.2,
    nombreMarca: 'Pescapro',
    stockTotal: 5,
    codigo: 78456 
}

const imagenesProducto = [
    caniaImg,
    filtroImg
]

const productosRelacionados = [
    {
        codigo: "404303",
        idProducto: 259,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX NOCHE",
        precio: 431200
    },
    {
        codigo: "404304",
        idProducto: 260,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX DIA",
        precio: 431200
    },
    {
        codigo: "404305",
        idProducto: 261,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX TARDE",
        precio: 431200
    },
    {
        codigo: "404306",
        idProducto: 262,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX NOCHE PLUS",
        precio: 431200
    },
    {
        codigo: "404307",
        idProducto: 263,
        nombreMarca: "CATERPILLAR",
        nombreMercaderia: "KOTEX DIA PLUS",
        precio: 431200
    },
]


const DetalleProducto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ product, setProduct ] = useState({});
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null); 
    const [seleccionMoneda, setSeleccionMoneda] = useState('')
    const [ selectedIdx, setSelectedIdx ] = useState(0)

    const prevImg = () => {
        setSelectedIdx(i => (i - 1 + imagenesProducto.length) % imagenesProducto.length)
      }
      const nextImg = () => {
        setSelectedIdx(i => (i + 1) % imagenesProducto.length)
      }
    
    const fetchProductById = async () => {  
        try {
            setLoading(true);
            const response = await axios.get('/api/productos/getProductoById', {
                params: { id }
            });
            setProduct(response.data.respuesta);  
        } catch (error) {
            console.error("Hubo un error al conseguir el producto: ", error);
            setError(error); 
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProductById();
    }, []);

    useEffect(() => {
        console.log(product)
    }, [product])

    return (
        <>
            <Box sx={{ margin: 5 }}>
              <CustomBreadcrumbs />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Container sx={{ display: 'flex', flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                    {/* BOX PARA LAS IMAGENES */}
                    <Box sx={{
                        borderRadius: '30px',
                        border: '1px solid #cecece',
                        minHeight: 640,
                        width: 600,
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff',
                    }}>
                        {/* CONTENEDOR DE IMAGENES */}
                        <Box
                            sx={{position: 'relative'}}
                        >
                            {/* FLECHA IZQUIERDA */}
                            <IconButton
                                onClick={prevImg}
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: 8,
                                    transform: 'translateY(-50%)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
                                }}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                            {/* IMAGEN PRINCIPAL */}
                            <Box
                                component="img"
                                src={imagenesProducto[selectedIdx]}
                                alt={`Imagen del producto en index ${selectedIdx + 1}`}
                                sx={{
                                    height: 438,
                                    width: '100%',
                                    borderRadius: '20%',
                                    objectFit: 'contain'
                                }}  
                            />
                            {/* FLECHA DERECHA */}
                            <IconButton
                                onClick={nextImg}
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    right: 8,
                                    transform: 'translateY(-50%)',
                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                                }}
                            >
                                <ChevronRightIcon />
                            </IconButton>

                            <Divider/>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                gap: 1,
                                overflowX: 'auto',
                            }}>
                                {
                                    imagenesProducto.map((imagen, index) => {
                                        return(
                                            <Box
                                                key={index}
                                                onClick={() => setSelectedIdx(index)}
                                                sx={{
                                                    borderRadius: '30px',
                                                    border: '1px solid #cecece',
                                                    minHeight: 180,
                                                    width: 160,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    backgroundColor: '#ffffff',
                                                    m: 1,
                                                    cursor: 'pointer',
                                                    overflow: 'hidden' 
                                                }}
                                            >
                                                <Box
                                                    component='img'
                                                    src={imagen}
                                                    alt="Imagen pequeña del producto"
                                                    sx={{
                                                        height: 180,
                                                        width: '100%',
                                                        borderRadius: '20%',
                                                        objectFit: 'contain'
                                                    }} 
                                                />
                                            </Box>
                                        )
                                    })
                                }
                            </Box>
                        </Box>
                    </Box>
                    {/* FORM BOX */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        marginTop: '18px'
                    }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: 1,
                            alignItems: 'center'
                        }}>
                            <Typography variant="body2">
                                <strong>Laboratorio:</strong>
                            </Typography>
                            <Typography variant="body2" sx={{
                                color: '#d4459f'
                            }}>
                                {product.nombreLab}
                            </Typography>
                        </Box>                            
                        {
                            product.stockTotal > 0 ?
                                /* SI ES QUE HAY PRODUCTOS */
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: 1
                                }}>
                                    <DoneAllIcon />  
                                    <Typography variant="body2"> En Stock</Typography>
                                </Box>
                                :
                                /* SI NO HAY PRODUCTOS */
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    gap: 1
                                }}>
                                    <RemoveDoneIcon />
                                    <Typography variant="body2"> Sin Stock</Typography>
                                </Box>
                        }
                        <Typography variant="h3">
                            {product.nombreMercaderia}
                        </Typography>
                        <Typography variant="body1">
                            <strong>Código: {product.codigo}</strong>
                        </Typography>
                        <Box sx={{
                            gap: 4
                        }}>
                            <Typography variant="body1">
                                <strong>Precio: {formatCurrency(product.precio)}</strong> 
                            </Typography>
                            <Typography variant="subtitle2">
                                * Precio exclusivo para compras con pago en efectivo.
                            </Typography>
                        </Box>
                        <SelectorCantidad producto={product} img={caniaImg}/>
                    </Box>
                </Container>
                <Box>
                    <ProductosDestacados
                        titulo={'Productos relacionados'}
                        productos={productosRelacionados}
                    />
                </Box>
            </Box>        
        </>
    )
}

export default DetalleProducto;