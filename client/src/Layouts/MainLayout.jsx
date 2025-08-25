import * as React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Outlet, useNavigate } from 'react-router-dom';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { Badge, Button, Icon, IconButton, styled, TextField, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useDispatch, useSelector } from 'react-redux';
import { setShowCart } from '../redux/cartSlice';
import CartView from '../Components/CartView';
import Footer from '../Components/Footer';
import logoImg from '../assets/farmaShop/cropped-Logo-Farmashop-Horizontal-blanco.png'
import fondo from '../assets/farmaShop/barra-principal.png'
import FloatingBubble from '../Components/FloatingBubble';
import { buscarProductos } from '../redux/searchSlice';

function ElevationScroll(props) {
    
  const { children, window } = props;
  // Note that you normally won't need to set the window ref as useScrollTrigger
  // will default to window.
  // This is only being set here because the demo is in an iframe.
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
    target: window ? window() : undefined,
  });

  return children
    ? React.cloneElement(children, {
        elevation: trigger ? 4 : 0,
      })
    : null;
}

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    padding: '0 4px',
  },
}));

const SearchBar = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    backgroundColor: 'white',
    borderRadius: '25px',
    padding: '0 8px',
    '&:hover': {
      backgroundColor: '#00000',
    },
    // Eliminar borde inferior en todos los estados
    '&::before, &::after': {
      borderBottom: 'none !important',
    },
    // Eliminar el hover (si es necesario)
    '&:hover:not(.Mui-disabled):before': {
      borderBottom: 'none !important',
    },
    // Eliminar el focus
    '&.Mui-focused:after': {
      borderBottom: 'none !important',
    }
  },
  '& .MuiInputBase-input': {
    padding: '8px 0',
  },
  '& .MuiInputLabel-root': {
    color: '#999',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#3c52b2',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#999',
    },
    '&:hover fieldset': {
      borderColor: '#3c52b2',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#3c52b2',
    },
  },
}));

export default function MainLayout(props) {
  const dispatch = useDispatch();
  const showCart = useSelector(state => state.carrito.showCart);
  const cartData = useSelector(state => state.carrito.cartData);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = React.useState('');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = (open) => () => setIsMenuOpen(open);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      dispatch(buscarProductos(searchTerm));
      navigate('/catalogo'); // Navega a la página de catálogo
    }
  };

  // Manejar tecla Enter en el campo de búsqueda
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <React.Fragment>
      <CssBaseline />
      <ElevationScroll {...props}>
        <AppBar position="fixed">
          <Toolbar sx={{
            backgroundImage: `url(${fondo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 'auto',
            minHeight: '80px',
            flexWrap: 'wrap',
            gap: 2,
            p: { xs: 1, md: 0 }
           }}>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                order: { xs: 3, md: 1 },
                width: { xs: '100%', md: 'auto' },
                justifyContent: { xs: 'center', md: 'flex-start' }
            }}>
                <Typography
                  variant='h6'
                  onClick={() => navigate('/catalogo')}
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    alignItems: 'center',
                    gap: 1.2,
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '0.9rem',
                    '&:hover': { color: '#ffd3ee' },
                }}>
                    <FormatListBulletedIcon sx={{ fontSize: '1.8rem' }}/>
                    Categorias
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: { xs: '100%', sm: '300px' } }}>
                  <SearchBar
                    variant='standard'
                    placeholder='Buscar producto'
                    size='small'
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <IconButton
                    onClick={handleSearch}
                  >
                    <SearchIcon sx={{ color: 'white' }}/>
                  </IconButton>
                </Box>
            </Box>
            <Box
              component='img'
              src={logoImg}
              alt='Logo empresa'
              onClick={() => navigate('/home')}
              sx={{
                height: { xs: '35px', md: '45px' },
                cursor: 'pointer',
                order: { xs: 1, md: 2 },
              }}
            />
            {/*ESTE ES EL BOX DE ICONOS*/}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 2, md: 3 },
              order: { xs: 2, md: 3 },
            }}> 
                {/* Botón de menú solo en pantallas chicas */}
                <IconButton
                  aria-label='abrir menú'
                  onClick={toggleMenu(true)}
                  sx={{
                    display: { xs: 'flex', md: 'none' },
                    color: 'white'
                  }}    
                >
                  <FormatListBulletedIcon />
                </IconButton>
                <IconButton onClick={() => navigate('/auth/login')} sx={{
                   fontSize: 'small',
                   display: 'flex',
                   justifyContent: 'center',
                   alignItems: 'center',
                   gap: 1,
                    color: 'white',
                    display: { xs: 'none', md: 'flex' }
                }}>
                  <PersonIcon />
                </IconButton>
                <Box>
                  <IconButton sx={{
                    fontSize: 'small',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1,
                    color: 'white',
                    display: { xs: 'none', md: 'flex' }
                  }}>
                    <FavoriteBorderOutlinedIcon sx={{
                      color: 'white',
                      fontSize: '25px'
                    }} />
                    1
                  </IconButton>
                </Box>
                <Box>
                  <IconButton
                    onClick={()=> dispatch(setShowCart(!showCart))} 
                    sx={{
                      fontSize: 'small',
                      color: 'white',                    
                    }}>
                    <StyledBadge badgeContent={cartData.length} color='primary'>
                      <ShoppingCartIcon/>
                    </StyledBadge>
                  </IconButton>
                </Box>
              {/* Carrito desplegable */}
              {
                showCart && (
                  <Box sx={{
                    position: 'fixed',
                    top: 60,
                    right: 16,
                    width:  {xs: '14rem', sm: '16rem', md: '18rem', lg: '22rem'},
                    maxWidth: 400,
                    backgroundColor: 'white',
                    boxShadow: 3,
                    borderRadius: 2,
                    zIndex: 1100,
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    border: '2px solid #D5DAE0'
                  }}>
                    <CartView />
                  </Box>
              )}
              {/* Drawer lateral para móviles */}
              <Drawer
                anchor='left'
                open={isMenuOpen}
                onClose={toggleMenu(false)}
              >
                <Box
                  sx={{ width: 260 }}
                  role='presentation'
                  onClick={toggleMenu(false)}
                  onKeyDown={toggleMenu(false)}
                >
                  <List>
                    <ListItemButton onClick={() => { setIsMenuOpen(false); navigate('/auth/login'); }}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText primary='Iniciar sesión' />
                    </ListItemButton>
                    <ListItemButton onClick={() => { setIsMenuOpen(false); }}>
                      <ListItemIcon>
                        <FavoriteBorderOutlinedIcon />
                      </ListItemIcon>
                      <ListItemText primary='Productos favoritos' />
                    </ListItemButton>
                  </List>
                  <Divider />
                  <List>
                    <ListItemButton onClick={() => { setIsMenuOpen(false); navigate('/home'); }}>
                      <ListItemIcon>
                        <FormatListBulletedIcon />
                      </ListItemIcon>
                      <ListItemText primary='Inicio' />
                    </ListItemButton>
                    <ListItemButton onClick={() => { setIsMenuOpen(false); navigate('/catalogo'); }}>
                      <ListItemIcon>
                        <FormatListBulletedIcon />
                      </ListItemIcon>
                      <ListItemText primary='Catálogo' />
                    </ListItemButton>
                    <ListItemButton onClick={() => { setIsMenuOpen(false); }}>
                      <ListItemIcon>
                        <FormatListBulletedIcon />
                      </ListItemIcon>
                      <ListItemText primary='Más opciones' />
                    </ListItemButton>
                  </List>
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </AppBar>
      </ElevationScroll>
      {/* Empuje para compensar AppBar fijo */}
      <Toolbar />
      <FloatingBubble 
        phoneNumber="595986703000"
        message="Hola, les escribo desde la web de Farmashop!"
      />
      <Box sx={{ width: '100%', overflowX: 'hidden', backgroundColor: '#f9f9f9', pt: { xs: 3, md: 0 } }}>
        <Outlet />
      </Box>
    <Box>
      <Footer />
    </Box>
    </React.Fragment>
  );
}