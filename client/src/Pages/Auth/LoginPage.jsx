import React, { useState } from 'react';
import { Box, Button, Divider, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState('email');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica real de login.
    // Por ahora, solo simulamos éxito y redirigimos a home.
    navigate('/home');
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
        Iniciar sesión
      </Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>Elige el método de inicio:</Typography>
      <RadioGroup
        row
        value={loginMode}
        onChange={(e) => setLoginMode(e.target.value)}
        sx={{ mb: 2 }}
      >
        <FormControlLabel value="email" control={<Radio />} label="Correo electrónico" />
        <FormControlLabel value="cedula" control={<Radio />} label="Cédula de identidad" />
      </RadioGroup>

      <Stack spacing={2}>
        {loginMode === 'email' ? (
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
        ) : (
          <TextField
            label="Cédula de identidad"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
            fullWidth
          />
        )}

        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />

        <Button type="submit" variant="contained" size="large">
          Ingresar
        </Button>

        <Divider>o</Divider>

        <Typography variant="body2" textAlign="center">
          ¿No tienes cuenta?{' '}
          <Link to="/auth/register">Crear cuenta</Link>
        </Typography>
      </Stack>
    </Box>
  );
}


