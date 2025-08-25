import { useEffect, useState } from 'react';
import { 
  Box,
  Button,
  IconButton,
  Input,
  Typography,
  styled
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useDispatch } from 'react-redux';
import { addProductoCarrito } from '../redux/cartSlice';

const SelectorCantidad = ({ producto, img }) => {
  // hook useState
  const [quantity, setQuantity] = useState(1);
  // hook useDispatch
  const dispatch = useDispatch();
  const [isBumping, setIsBumping] = useState(false);

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if(quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  useEffect(() => {
    setIsBumping(true);
    const timer = setTimeout(() => setIsBumping(false), 180);
    return () => clearTimeout(timer);
  }, [quantity]);

  return (
    <Box display="flex" alignItems="center" gap={2} sx={{ flexDirection: { xs: 'column', sm: 'row' }, width: '100%' }}>
        <Box sx={{
            border: '1px solid #767676',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '16px',
            height: { xs: 48, sm: 56, md: 68 },
            width: { xs: '100%', sm: 180, md: 200 },
            maxWidth: { xs: '100%', sm: 'unset' },
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            animation: isBumping ? 'bump 180ms ease-out' : 'none',
            '@keyframes bump': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' }
            }
        }}>
            <Box 
                sx={{
                    height: '100%',
                    width: '100%',
                    borderRight: '1px solid #767676',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderTopLeftRadius: '16px',
                    borderBottomLeftRadius: '16px',
                    transition: 'background-color 0.12s',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    '@media (hover: hover)': {
                      '&:hover': { backgroundColor: '#ff6bc6' }
                    },
                    '&:active': { backgroundColor: 'rgba(255,107,198,0.4)' }
                }}
                onClick={handleDecrement}
            >
                <RemoveIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </Box>

        
            <Input
                value={quantity}
                readOnly
                disableUnderline
                inputProps={{ 
                    style: { 
                        textAlign: 'center',
                        width: '50px',
                        padding: 0,
                        fontSize: 18
                    }
                }}
                sx={{
                    padding: { xs: '4px 8px', sm: '8px 8px' },
                    '& input': {
                    '-moz-appearance': 'textfield',
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                            '-webkit-appearance': 'none',
                            margin: 0
                        }
                    }
                }}
            />

            <Box 
                sx={{
                    height: '100%',
                    width: '100%',
                    borderLeft: '1px solid #767676',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    transition: 'background-color 0.12s',
                    borderTopRightRadius: '16px',
                    borderBottomRightRadius: '16px',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    '@media (hover: hover)': {
                      '&:hover': { backgroundColor: '#ff6bc6' }
                    },
                    '&:active': { backgroundColor: 'rgba(255,107,198,0.4)' }
                }}
                onClick={handleIncrement}
            >
                <AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </Box>
        </Box>
      
        <Button
            variant='contained'
            sx={{
                py: { xs: 1.2, sm: 1.6 },
                px: { xs: 2, sm: 6, md: 12 },
                backgroundColor: '#D4459F',
                color: 'rgb(255, 255, 255)',
                width: { xs: '100%', sm: 'auto' },
                borderRadius: 2
            }}
            onClick={() => dispatch(addProductoCarrito({ 
                ...producto,
                caniaImage: img,
                cantidad: quantity
            }))}
        >
            Agregar al carrito
        </Button>
    </Box>
  );
};

export default SelectorCantidad;