import React, { useState } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica real de registro.
    // Por ahora, simulamos éxito y redirigimos al login.
    navigate('/auth/login');
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
        Crear cuenta
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Nombre y apellido"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          fullWidth
        />

        <TextField
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />

        <TextField
          label="Cédula de identidad"
          value={cedula}
          onChange={(e) => setCedula(e.target.value)}
          required
          fullWidth
        />

        <TextField
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />

        <Button type="submit" variant="contained" size="large">
          Registrarme
        </Button>

        <Typography variant="body2" textAlign="center">
          ¿Ya tienes cuenta?{' '}
          <Link to="/auth/login">Inicia sesión</Link>
        </Typography>
      </Stack>
    </Box>
  );
}


