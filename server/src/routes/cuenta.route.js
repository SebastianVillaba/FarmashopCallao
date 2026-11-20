// Cuentas de clientes de la tienda (/api/cuenta)
import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireCliente } from '../middleware/authCliente.js';
import * as cuenta from '../controllers/cuenta.controller.js';

const router = express.Router();

// Datos personales: nunca se cachean
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

const limite = (limit, error) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error }
});

router.post('/registro', limite(10, "Demasiados registros desde esta conexión, probá más tarde"), cuenta.registro);
router.post('/login', limite(15, "Demasiados intentos, probá de nuevo en unos minutos"), cuenta.login);
router.post('/logout', cuenta.logout);

router.use(requireCliente);
router.get('/me', cuenta.me);
router.put('/me', cuenta.actualizarPerfil);
router.put('/me/email', limite(10, "Demasiados intentos, probá de nuevo en unos minutos"), cuenta.cambiarEmail);
router.put('/me/password', limite(10, "Demasiados intentos, probá de nuevo en unos minutos"), cuenta.cambiarPassword);

router.get('/favoritos', cuenta.listarFavoritos);
router.post('/favoritos/sincronizar', cuenta.sincronizarFavoritos);
router.put('/favoritos/:idProducto', cuenta.agregarFavorito);
router.delete('/favoritos/:idProducto', cuenta.quitarFavorito);

router.get('/pedidos', cuenta.misPedidos);

export default router;
