import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Grid, 
  TextField, 
  Typography, 
  Paper, 
  FormControlLabel, 
  Checkbox, 
  Button,
  Divider,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel
} from "@mui/material";
import { useState } from "react";
import { styled } from '@mui/material/styles';
import { QontoConnector, QontoStepIcon } from "../Mui/QuontoStepper";
import { useSelector } from "react-redux";

// Componentes estilizados
const StyledTextField = styled(TextField)(({ theme }) => ({
'& .MuiInputLabel-root': {
  color: '#666666',
  fontSize: '0.9rem',
},
'& .MuiOutlinedInput-root': {
  borderRadius: '8px',
  '&.Mui-focused': {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: '#D73A35',
      borderWidth: '2px',
    },
  },
  '&:hover:not(.Mui-focused)': {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.action.hover,
    }
  }
},
'& .MuiInputBase-input': {
  padding: '12px 14px',
}
}));

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
'& .MuiTypography-root': {
  fontSize: '0.9rem',
},
'& .MuiSvgIcon-root': {
  width: '0.8em'
}
}));

// Datos constantes
const ciudades = ['Encarnacion', 'Asuncion', 'Ciudad del Este', 'Pedro Juan Caballero', 'Concepcion', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 'Lambare', 'Capiata', 'Hohenau'];
const steps = ['Carrito', 'Datos de facturación', 'Datos de envío', 'Datos para el pago', 'Finalizar'];

// Componentes de los pasos
const DatosFacturacion = () => (
<Grid container spacing={3}>
  <Grid item xs={12} md={12}>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <StyledTextField fullWidth label="RUC *" />
      </Grid>
      <Grid item xs={6}>
        <StyledTextField fullWidth label="Razón Social *" />
      </Grid>
      <Grid item xs={12}>
        <StyledTextField fullWidth label="Email *" />
      </Grid>
      <Grid item xs={12}>
        <StyledTextField fullWidth label="Teléfono *" />
      </Grid>
    </Grid>
  </Grid>
</Grid>
);

const DatosEnvio = ({ shippingMethod, setShippingMethod, envioForm, handleEnvioFormChange }) => {
const sucursalCoordinates = { 
  lat: -25.31007856537299, 
  lng: -57.59287125342503 
};

const MapContainer = () => (
  <div style={{ height: '25vh', width: '100%', marginTop: '20px' }}>
    <iframe
      width="100%"
      height="100%"
      frameBorder="0"
      scrolling="no"
      marginHeight="0"
      marginWidth="0"
      src={`https://maps.google.com/maps?q=${sucursalCoordinates.lat},${sucursalCoordinates.lng}&z=15&output=embed`}
      title="Ubicación de la sucursal"
    />
  </div>
);

return (
  <Box>
    <Grid container spacing={3}>
      <Grid item xs={12} md={10}>
        <FormControl component="fieldset" sx={{ width: '100%' }}>
          <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>Método de envío</FormLabel>
          <RadioGroup
            value={shippingMethod}
            onChange={(e) => setShippingMethod(e.target.value)}
            sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}
          >
            <FormControlLabel 
              value="retiro" 
              control={<Radio />} 
              label="Pasar a retirar" 
            />
            <FormControlLabel
              value="delivery"
              control={<Radio />}
              label="Envío a domicilio"
            />
          </RadioGroup>

          {shippingMethod === 'retiro' ? (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Elige la sucursal</Typography>
              <TextField
                fullWidth
                select
                SelectProps={{ native: true }}
                value="7"
              >
                <option value="7">CASA MATRIZ</option>
              </TextField>
              
              <Box sx={{ gap: 2 }}>
                <MapContainer />
                <Box sx={{ my: 2 }}>
                  <StyledTextField 
                    fullWidth
                    label="Observacion"
                    multiline
                    rows={4}
                    placeholder="Ej: Retirar el lunes a las 10:00 am"
                  />
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <StyledTextField 
                  fullWidth 
                  label="Direccion" 
                  name="direccion"
                  value={envioForm.direccion} 
                  onChange={handleEnvioFormChange} 
                />
                <StyledTextField 
                  select 
                  fullWidth 
                  label="Ciudad" 
                  name="ciudad"
                  value={envioForm.ciudad} 
                  onChange={handleEnvioFormChange}
                >
                  {ciudades.map((ciudad, index) => (
                    <option key={index} value={ciudad} style={{ padding: 8 }}>{ciudad}</option>
                  ))}
                </StyledTextField>
              </Box>
              <StyledTextField 
                fullWidth 
                label="Observacion"
                name="observacion"
                multiline
                rows={4}
                value={envioForm.observacion} 
                onChange={handleEnvioFormChange} 
              />
            </Box>
          )}
        </FormControl>
      </Grid>
    </Grid>
  </Box>
);
};

const DatosPago = ({ paymentMethod, setPaymentMethod }) => (
<Grid container spacing={3}>
  <Grid item xs={12} md={12}>
    <FormControl component="fieldset">
      <FormLabel component="legend">Método de pago</FormLabel>
      <RadioGroup
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
      >
        <FormControlLabel
          value="transferencia"
          control={<Radio />}
          label="Transferencia o depósito bancario"
        />
        <FormControlLabel
          value="qr"
          control={<Radio />}
          label="Pago QR"
        />
        <FormControlLabel
          value="tarjeta"
          control={<Radio />}
          label="Tarjeta de débito/crédito"
        />
      </RadioGroup>

    </FormControl>
      {paymentMethod === 'transferencia' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Datos para depósito:</strong><br />
            Titular: Filtros Paraguay S.A.<br />
            RUC: 80020578-2<br />
            Banco Atlas: 845367<br /><br />
            Enviar comprobante al WhatsApp: 0999 123456
          </Typography>
        </Box>
      )}

      {paymentMethod === 'qr' && (  
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <Typography variant="subtitle2" gutterBottom>
            Escanea el código QR para realizar el pago con el app de tu banco de preferencia. Una vez realizado el pago, enviar una FOTO o CAPTURA DE PANTALLA del comprobante al siguiente numero de Whatsapp 0999 123456
          </Typography>
          <Box 
            component='img'
            src="https://norfipc.com/img/qr/url-d-norfipc.png"
            padding={4}
          />
        </Box>
      )}
  </Grid>
</Grid>
);

const ResumenFinal = () => (
<Box>
  <Typography variant="h6" gutterBottom>
    Resumen de la compra
  </Typography>
  <Typography>
    Por favor verifique que todos los datos sean correctos antes de finalizar la compra.
  </Typography>
</Box>
);

// Componente principal
const CheckoutPage = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('retiro');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [envioForm, setEnvioForm] = useState({
    direccion: '',
    ciudad: '',
    observacion: ''
  });
  const cartData = useSelector((state) => state.carrito.cartData)
  const descuento = 20000
  const subtotal = cartData.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)
  const total = subtotal - descuento;
  const handleEnvioFormChange = (e) => {
    setEnvioForm({
      ...envioForm,
      [e.target.name]: e.target.value 
    });
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 1:
        return <DatosFacturacion />;
      case 2:
        return (
          <DatosEnvio
            shippingMethod={shippingMethod}
            setShippingMethod={setShippingMethod}
            envioForm={envioForm}
            handleEnvioFormChange={handleEnvioFormChange}
          />
        );
      case 3:
        return <DatosPago paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />;
      case 4:
        return <ResumenFinal />;
      default:
        return 'Paso desconocido';
    }
  };

  return (
    <Box sx={{ maxWidth: '140vh', margin: 'auto', p: 3 }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 7, mb: 4 }} connector={<QontoConnector />}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel StepIconComponent={QontoStepIcon}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ display: 'flex', gap: 4, justifyContent: 'flex-start' }}>
        <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, width: '100vh' }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
            {steps[activeStep]}
          </Typography>
          {getStepContent(activeStep)}
        </Box>  

        {activeStep < 4 && (
          <Paper sx={{ p: 3, bgcolor: 'background.paper', minWidth: '35vh', height: '45vh' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1
              }}>
                <Typography>Subtotal</Typography>
                <Typography fontWeight={'bold'}>Gs {subtotal.toLocaleString('es-ES')}</Typography>
              </Box>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1
              }}>
                <Typography>Descuento</Typography>
                <Typography fontWeight={'bold'}>Gs {descuento.toLocaleString('es-ES')}</Typography>
              </Box>
            </Box>
            <Box>
              <StyledTextField sx/>
            </Box>
            <Box sx={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1
            }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" fontWeight={'bold'}>Gs {total.toLocaleString('es-ES')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <StyledFormControlLabel
                control={<Checkbox />}
                label="Acepto las políticas de envio"
              />
              <StyledFormControlLabel
                control={<Checkbox required />}
                label="Acepto las políticas de devolución"
              />
              <Button variant="contained" onClick={handleNext} sx={{ my: 2 }}>
                {activeStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button disabled={activeStep === 1} onClick={handleBack} variant="outlined">
          Anterior
        </Button>
      </Box>
    </Box>
  );
};

export default CheckoutPage;