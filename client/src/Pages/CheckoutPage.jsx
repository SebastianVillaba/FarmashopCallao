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
  FormLabel,
  Grid2,
  Collapse
} from "@mui/material";
import { useState } from "react";
import { styled } from '@mui/material/styles';
import { QontoConnector, QontoStepIcon } from "../Mui/QuontoStepper";
import { useSelector } from "react-redux";
import FarmaTextField from "../Mui/TextField/FarmaTextField";
import { formatCurrency } from "./CartPage";
import FarmaSelect from "../Mui/TextField/FarmaSelect";

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
const ciudades = [ 'Encarnacion', 'Asuncion', 'Ciudad del Este', 'Pedro Juan Caballero', 'Concepcion', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 'Lambare', 'Capiata', 'Hohenau' ];
const steps = [ 'Carrito', 'Datos del cliente', 'Datos de envío', 'Datos para el pago' ];

// Componentes de los pasos
const DatosFacturacion = () => (
<Grid2 container spacing={3}>
      <Grid2 item size={{xs: 12, md: 4}}>
        <FarmaTextField
          label="Nombre"
          required
       />
      </Grid2>
      <Grid2 item size={{xs: 12, md: 4}}>
        <FarmaTextField
          label="Apellido"
          required
        />
      </Grid2>
      <Grid2 item size={{xs: 12, md: 4}}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <FarmaSelect
            id="sexo"
            label="Sexo"
            name="sexoCliente"
            required
            options={[
              { value: "", label: "Seleccione" },	
              { value: "hombre", label: "Hombre" },
              { value: "mujer", label: "Mujer" },
              { value: "helicopteroApache", label: "Otro" }
            ]}
            placeholder="Seleccione una opción"
          />
        </Box>
      </Grid2>
      <Grid2 item size={{xs: 10, md: 12}}>
        <FarmaTextField label="Email *" />
      </Grid2>
      <Grid2 item size={{xs: 10, md: 12}}>
        <FarmaTextField label="Teléfono *"/>
      </Grid2>
</Grid2>
);

const DatosEnvio = ({ 
  shippingMethod, 
  setShippingMethod, 
  envioForm, 
  handleEnvioFormChange,
  selectedSucursal,
  setSelectedSucursal,
  sucursalesCoordenadas
}) => {
  
  const handleSucursalChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selected = sucursalesCoordenadas.find(s => s.id === selectedId);
    setSelectedSucursal(selected);
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
        src={`https://maps.google.com/maps?q=${selectedSucursal?.coords?.lat},${selectedSucursal?.coords?.lng}&z=15&output=embed`}
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
                  value={selectedSucursal?.id || ''}
                  onChange={handleSucursalChange}
                >
                  {sucursalesCoordenadas.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </TextField>
                
                <Box sx={{ gap: 2 }}>
                  <MapContainer />
                  <Box sx={{ my: 2 }}>
                    <FarmaTextField 
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
                  <Grid2 container spacing={1}>
                    {/* Calle Principal */}
                    <Grid2 item size={{ xs: 12, md: 12 }}>
                      <FarmaTextField 
                        fullWidth 
                        label="Calle principal" 
                        name="callePrincipal"
                        value={envioForm.callePrincipal} 
                        onChange={handleEnvioFormChange}
                        required
                        placeholder={'Ingresá la calle principal'}
                      />
                    </Grid2>

                    {/* Calle Secundaria */}
                    <Grid2 item size={{ xs: 12, md:12 }}>
                      <Typography variant="subtitle2" gutterBottom>Calle secundaria *</Typography>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cccccc',
                            fontSize: '16px',
                            backgroundColor: 'white',
                            width: '120px' // Ancho fijo para el selector
                          }}
                          value={envioForm.relacionCalles}
                          onChange={handleEnvioFormChange}
                          name="relacionCalles"
                        >
                          <option value="casi">Casi</option>
                          <option value="entre">Entre</option>
                          <option value="esquina">Esquina</option>
                        </select>
                        <FarmaTextField 
                          fullWidth 
                          name="calleTransversal"
                          value={envioForm.calleTransversal} 
                          onChange={handleEnvioFormChange}
                          placeholder='Ingresá una calle transversal'
                        />
                      </div>
                    </Grid2>

                    {/* Campo adicional para 'Entre' */}
                    <Grid2 item size={{ xs: 12, md: 12 }}>
                      <Collapse 
                        in={envioForm.relacionCalles === 'entre'} 
                        timeout="auto"
                        sx={{ width: '100%' }} // Importante para animación horizontal
                      >
                        <FarmaTextField 
                          fullWidth 
                          label="La calle que cruza"
                          name="calleTransversal2"
                          value={envioForm.calleTransversal2}
                          onChange={handleEnvioFormChange}
                          placeholder='Ingresa la calle que cruza'
                        />
                      </Collapse>
                    </Grid2>

                    {/* Selector de Ciudad */}
                    <Grid2 item size={{ xs: 12, md: 12 }}>
                      <Typography variant="subtitle2" gutterBottom>Ciudad *</Typography>
                      <select 
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cccccc',
                          fontSize: '16px',
                          backgroundColor: 'white',
                          width: '100%' // Asegurar mismo ancho que otros campos
                        }}
                        value={envioForm.ciudad}
                        onChange={handleEnvioFormChange}
                        name="ciudad"
                      >
                        {ciudades.map((ciudad) => (
                          <option 
                            key={ciudad} 
                            value={ciudad}
                            style={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis' 
                            }}
                          > 
                            {ciudad}
                          </option>
                        ))}
                      </select>
                    </Grid2>
                  </Grid2>
                </Box>
                <FarmaTextField 
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
<Grid2 container spacing={3}>
  <Box width={'65%'} >
    <Grid2 container spacing={2}>
      <Typography variant="h7"><strong>Datos para la factura</strong></Typography>
      <Grid2 item size={{ xs: 12, md: 8 }} >
        <FarmaTextField
          label='Ingrese su número de cédula o RUC'
          required
          name='cedulaRuc'
        />
      </Grid2>
      <Grid2 item size={{ xs: 12, md: 4 }} >
        <FarmaTextField
          label='Dígito verificador'
          name='digitoVerificador'
        />
      </Grid2>
    </Grid2>
  </Box>
  <Grid2 item size={{ xs: 12, md: 12 }} >
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
  </Grid2>
</Grid2>
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
  // VARIABLE DE SUCURSALES
  const sucursalesCoordenadas = [
    {
      id: 1,
      nombre: 'CASA MATRIZ',
      coords: { lat: -27.083312, lng: -55.649169 }
    },
    {
      id: 2,
      nombre: 'FARMASHOP SUCURSAL 1',
      coords: { lat: -27.079504, lng: -55.645760 }
    },
    {
      id: 3,
      nombre: 'FARMASHOP HOHENAU CENTRO',
      coords: { lat: -27.083315, lng: -55.649176 }
    },
    {
      id: 4,
      nombre: 'FARMASHOP OBLIGADO',
      coords: { lat: -27.055854, lng: -55.628102 }
    }
  ];

  // ZONA DE ESTADOS 
  const [activeStep, setActiveStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState('retiro');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [envioForm, setEnvioForm] = useState({
    callePrincipal: '',
    relacionCalles: 'casi',
    calleTransversal: '',
    calleTransversal2: '',
    ciudad: '',
    observacion: ''
  });
  const [selectedSucursal, setSelectedSucursal] = useState(sucursalesCoordenadas[0]);

  // ZONA DE VARIABLES
  const cartData = useSelector((state) => state.carrito.cartData);
  const descuento = 20000;
  const envio = 5000;
  const subtotal = cartData.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const total = subtotal - descuento + envio;

  // ZONA DE HANDLERS
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
            selectedSucursal={selectedSucursal}
            setSelectedSucursal={setSelectedSucursal}
            sucursalesCoordenadas={sucursalesCoordenadas}
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
        <Box sx={{ borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, width: '100vh', border: '1px solid rgba(0, 0, 0, 0.20)' }}>
          <Box sx={{
            p: 2.5,
            borderBottom: '1px solid rgba(0, 0, 0, 0.20)'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {steps[activeStep]}
            </Typography>
          </Box>
          <Box sx={{
            p: 3
          }}>
            {getStepContent(activeStep)}
          </Box>
        </Box>

        {activeStep < 4 && (
          <Paper sx={{ bgcolor: 'background.paper', minWidth: '35vh', height: '100%', border: '1px solid rgba(0, 0, 0, 0.20)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{
                borderBottom: '1px solid rgba(0, 0, 0, 0.20)',
                p: 1.5
              }}>
                <Typography variant="h6">Resumen de compra</Typography>
              </Box>
              <Box sx={{
                p: 2
              }}>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography>Subtotal</Typography>
                  <Typography fontWeight={'bold'}>{formatCurrency(subtotal)}</Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography>Descuento</Typography>
                  <Typography fontWeight={'bold'}>{formatCurrency(descuento)}</Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <Typography>Envío</Typography>
                  <Typography fontWeight={'bold'}>{formatCurrency(envio)}</Typography>
                </Box>
                <Divider sx={{
                  my: 1,
                  backgroundColor: 'rgba(64, 64, 64, 0.2)'
                }} />
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" fontWeight={'bold'}>Gs {total.toLocaleString('es-ES')}</Typography>
                </Box>
                <Divider sx={{
                  my: 1,
                  backgroundColor: 'rgba(64, 64, 64, 0.2)'
                }}/>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column'
                }}>
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
              </Box>
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