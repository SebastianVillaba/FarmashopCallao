import { Box, Divider, Typography, Grid2 } from '@mui/material';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary, {
  accordionSummaryClasses,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CircleIcon from '@mui/icons-material/Circle';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { setCategoriaSeleccionada } from '../redux/utilsSlice.js';
import { useFocus } from '../hooks/useFocusHook.js';
import { buscarProductosPorCategoria, limpiarCategoria } from '../redux/searchSlice';
import { useNavigate } from 'react-router-dom';


const Accordion = styled((props) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({

}));

const AccordionSummary = styled((props) => (
    <MuiAccordionSummary
      expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
      {...props}
    />
  ))(({ theme }) => ({
    borderBottom: '1px solid #D4459F',
    backgroundColor: '#fce3f2',
    flexDirection: 'row-reverse',
    [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]:
      {
        transform: 'rotate(90deg)',
      },
    [`& .${accordionSummaryClasses.content}`]: {
      marginLeft: theme.spacing(1),
    },
    ...theme.applyStyles('dark', {
      backgroundColor: '#fce3f2',
    }),
}));
  
const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(1),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
    backgroundColor: '#fce3f2',
    '&:hover': {
        backgroundColor: '#fce3f2',
        
    }
}));

const descuentosOffline = [
    { id: 1, nombre: "Descuento del 10%" },
    { id: 2, nombre: "Descuento del 20%" },
    { id: 3, nombre: "Descuento del 30%" },
    { id: 4, nombre: "Descuento del 40%" },
    { id: 5, nombre: "Descuento del 50%" }
]

const SideCategorias = () => {

    // Hooks y utilitarios REDUX
    const dispatch = useDispatch();
    const categoriaSeleccionada = useSelector(state => state.utilitarios.categoriaSeleccionada);

    // Hooks useState
    const [ categories, setCategories ] = useState([]);
    const [ marcas, setMarcas ] = useState([]);
    const [ descuentos, setDescuento ] = useState([]);

    //Hook navigate
    const navigate = useNavigate();

    const handleSelectCategory = (id) => {
        dispatch(setCategoriaSeleccionada(id));
        dispatch(limpiarCategoria()); // Limpiar búsqueda previa
        dispatch(buscarProductosPorCategoria(id));
        navigate('/catalogo'); // Navegar a la página de catálogo
    };



    const getCategories = async () => {
        try {
            const response = await axios.get("/api/productos/getCategorias");
            console.log(response);
            setCategories(response.data.respuesta);
        } catch (error) {
            console.error("Error al obtener las categorías: ui", error);
            setCategories([]);
        }
    }

    
    // // Función para obtener marcas
    // const getMarcas = async (tipoProducto) => {
    //     try {
    //         const response = await axios.get("/api/productos/getMarcaByTipo", {
    //             params: { tipoProducto }
    //         });
    //         setMarcas(response.data.respuesta);
    //     } catch (error) {
    //         console.error("Error al obtener las marcas:", error);
    //         setMarcas([]);
    //     }
    // }

    useEffect(() => {
        getCategories();
    }, []);

    // useEffect(() => {
    //     if(categoriaSeleccionada) {
    //         getMarcas(categoriaSeleccionada);
    //     }
    // }, [categoriaSeleccionada]);

    return (
        <Box sx={{
            backgroundColor: '#fce3f2',
            p: 2.5,
            borderRadius: '20px',
            boxShadow: '0px 3px 5px 0px rgba(0,0,0,0.30);',
            height: '100%'
        }}>
            <Box sx={{
                borderBottom: '1px solid #D4459F',
                mb: 2,
            }}>
                <Typography variant="h5" sx={{ color: '#d35fa7', mb: 1 }}>
                    Filtrar por:
                </Typography>
            </Box>
            
            <Box sx={{
                width: "100%",
            }}>
                <ProductosAcordeon
                    categorias={categories} 
                    onSelectCategory={handleSelectCategory}
                    selectedCategory={categoriaSeleccionada}
                    marcas={marcas}
                    descuentos={descuentos}
                />
            </Box>
        </Box>
    );
};

// Acordeon de ver todos los productos
const ProductosAcordeon = ({ categorias, onSelectCategory, selectedCategory, marcas, descuentos }) => {
    const [expanded, setExpanded] = React.useState(false);
    
    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <>
            <Accordion 
                expanded={expanded === 'panel1'} 
                onChange={handleChange('panel1')}
            >
                <AccordionSummary>Descuentos</AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column'}}>
                        {descuentosOffline.length > 0 && (
                            <>
                                {descuentosOffline.map(descuento => (
                                    <Box
                                     key={descuento.id} 
                                     sx={{
                                            cursor: "pointer", 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            p: 1,
                                            padding: "8px",
                                            transition: "background-color 0.5s",
                                            '&:hover': {
                                                backgroundColor: "#efb3d7"
                                            }  
                                        }}>
                                        <Typography variant="body2">{descuento.nombre}</Typography>
                                    </Box>
                                ))}
                            </>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>
            <Accordion 
                expanded={expanded === 'panel2'} 
                onChange={handleChange('panel2')}
            >
                <AccordionSummary>Categorias</AccordionSummary>
                <AccordionDetails >
                    {categorias.map((category) => (
                        <CategoryItem 
                            key={category.idTipoProducto}
                            name={category.nombreTipo}
                            isSelected={selectedCategory === category.idTipoProducto}
                            onClick={() => {
                                onSelectCategory(category.idTipoProducto);
                                setExpanded('panel2'); // Actualiza el estado aquí
                            }}
                        />
                    ))}
                </AccordionDetails>
            </Accordion>
            <Accordion 
                expanded={expanded === 'panel3'} 
                onChange={handleChange('panel3')}
            >
                <AccordionSummary>Marcas</AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column'}}>
                        {marcas.length > 0 && (
                            <>
                                {marcas.map(marca => (
                                    <Box
                                     key={marca.idMarca} 
                                     sx={{
                                            cursor: "pointer", 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            p: 1,
                                            padding: "8px",
                                            transition: "background-color 0.5s",
                                            '&:hover': {
                                                backgroundColor: "#efb3d7"
                                            }  
                                        }}>
                                        <Typography variant="body2">{marca.nombreMarca}</Typography>
                                    </Box>
                                ))}
                            </>
                        )}
                    </Box>
                </AccordionDetails>
            </Accordion>
        </>
    )
}

// Componente CategoryItem corregido
const CategoryItem = ({ name, isSelected, onClick }) => (
    <Box
        onClick={onClick} 
        sx={{
            cursor: "pointer",
            padding: "8px",
            transition: "background-color 0.5s",
            '&:hover': {
                backgroundColor: "#efb3d7"
            }
    }}>
        <Typography 
            component="span"
            
            sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: 'inherit',
            }}>
            {name}
        </Typography>
    </Box>
);


export default SideCategorias;