import { useState } from 'react';
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

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if(quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
        <Box sx={{
            border: '1px solid #767676',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '16px',
            height: '68px',
            width: '168px'
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
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: '#ff6bc6',
                    }
                }}
                onClick={handleDecrement}
            >
                <RemoveIcon fontSize="medium" />
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
                        fontSize: 20
                    }
                }}
                sx={{
                    padding: '8px 8px',
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
                    transition: 'background-color 1seg',
                    borderTopRightRadius: '16px',
                    borderBottomRightRadius: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                        backgroundColor: '#ff6bc6',
                    }
                }}
                onClick={handleIncrement}
            >
                <AddIcon fontSize="small" />
            </Box>
        </Box>
      
        <Button
            variant='contained'
            sx={{
                py: 2,
                px: 12,
                backgroundColor: '#D4459F',
                color: 'rgb(255, 255, 255)',
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