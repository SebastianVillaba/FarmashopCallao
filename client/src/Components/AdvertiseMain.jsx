// AdvertiseMain.jsx
import { 
    Box, 
    Modal, 
    IconButton,
    styled,
    Collapse
  } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import camionImg from '../assets/camioneta.png';
  
// Estilos para ambos modales
const MainModalContent = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: 800,
    backgroundColor: theme.palette.background.paper,
    boxShadow: 24,
    borderRadius: 4,
    outline: 'none',
    maxHeight: '90vh',
    overflow: 'hidden'
}));

const FloatingWindow = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: 300,
    backgroundColor: theme.palette.background.paper,
    boxShadow: 24,
    borderRadius: 4,
    overflow: 'hidden',
    zIndex: 9999
}));

const CloseButton = styled(IconButton)({
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)'
    }
});
  
const AdvertiseMain = ({ 
    openMain, 
    openMini, 
    onCloseMain, 
    onCloseMini 
}) => {
    return (
        <>
          {/* Pop-up principal */}
          <Modal
            open={openMain}
            onClose={onCloseMain}
            aria-labelledby="main-ad-modal"
          >
            <MainModalContent>
              <CloseButton onClick={onCloseMain}>
                <CloseIcon />
              </CloseButton>
              <Box
                component="img"
                src={camionImg}
                alt="Promoción principal"
                sx={{ width: '100%', height: 'auto' }}
              />
            </MainModalContent>
          </Modal>
        
          {/* Ventana flotante */}
          <Collapse in={openMini}>
              <FloatingWindow>
                  <CloseButton 
                      size="small"
                      onClick={onCloseMini}
                      sx={{ right: 4, top: 4 }}
                  >
                      <CloseIcon fontSize="small" />
                  </CloseButton>
                  <Box
                      component="img"
                      src={camionImg} // Imagen diferente o misma
                      alt="Promoción secundaria"
                      sx={{ width: '100%', height: 'auto' }}
                  />
              </FloatingWindow>
          </Collapse>
        </>
  );
};
  
export default AdvertiseMain;