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

const Accordion = styled((props) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&::before': {
      display: 'none',
    },
}));

const AccordionSummary = styled((props) => (
    <MuiAccordionSummary
      expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
      {...props}
    />
  ))(({ theme }) => ({
    backgroundColor: 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]:
      {
        transform: 'rotate(90deg)',
      },
    [`& .${accordionSummaryClasses.content}`]: {
      marginLeft: theme.spacing(1),
    },
    ...theme.applyStyles('dark', {
      backgroundColor: 'rgba(255, 255, 255, .05)',
    }),
}));
  
const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(1),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

const SideCategorias = () => {

    // Hooks y utilitarios REDUX
    const dispatch = useDispatch();
    const categoriaSeleccionada = useSelector(state => state.utilitarios.categoriaSeleccionada);

    // Hooks useState
    const [ categories, setCategories ] = useState([]);
    const [ marcas, setMarcas ] = useState([]);


    const getCategories = async () => {
        try {
            const response = await axios.get("/api/productos/getTipoProductos");
            setCategories(response.data.respuesta);
        } catch (error) {
            console.error("Error al obtener las categorías: ui", error);
            setCategories([]);
        }
    }

    
    // Función para obtener marcas
    const getMarcas = async (tipoProducto) => {
        try {
            const response = await axios.get("/api/productos/getMarcaByTipo", {
                params: { tipoProducto }
            });
            setMarcas(response.data.respuesta);
        } catch (error) {
            console.error("Error al obtener las marcas:", error);
            setMarcas([]);
        }
    }

    useEffect(() => {
        getCategories();
    }, []);

    useEffect(() => {
        if(categoriaSeleccionada) {
            getMarcas(categoriaSeleccionada);
        }
    }, [categoriaSeleccionada]);

    return (
        <Box sx={{
            width: "15%",
            
        }}>
            <ProductosAcordeon
                categorias={categories} 
                onSelectCategory={(id) => dispatch(setCategoriaSeleccionada(id))}
                selectedCategory={categoriaSeleccionada}
                marcas={marcas}
            />
        </Box>
    );
};

// Acordeon de ver todos los productos
const ProductosAcordeon = ({ categorias, onSelectCategory, selectedCategory, marcas }) => {
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
                <AccordionSummary>Ver todas las categorias</AccordionSummary>
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
                expanded={expanded === 'panel2'} 
                onChange={handleChange('panel2')}
            >
                <AccordionSummary>Ver todas las marcas</AccordionSummary>
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
                                                backgroundColor: "#dbd9d9"
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
                backgroundColor: "#dbd9d9"
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