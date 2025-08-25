import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}>
      <Typography variant="h3" fontWeight={700}>404</Typography>
      <Typography variant="h6">Página no encontrada</Typography>
      <Typography color="text.secondary" textAlign="center">
        Lo sentimos, no pudimos encontrar la página que buscas.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/home')}>Volver al inicio</Button>
    </Box>
  );
}


