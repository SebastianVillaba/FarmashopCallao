// Rutas del panel administrativo (/api/admin). Todo requiere sesión salvo el login.
import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRol } from '../../middleware/auth.js';
import { subida } from '../../utils/imagenes.js';
import * as auth from '../../controllers/admin/auth.controller.js';
import * as productos from '../../controllers/admin/productos.controller.js';
import * as sitio from '../../controllers/admin/sitio.controller.js';
import * as usuarios from '../../controllers/admin/usuarios.controller.js';
import * as pedidos from '../../controllers/admin/pedidos.controller.js';
import * as clientes from '../../controllers/admin/clientes.controller.js';
import { tablero } from '../../controllers/admin/stats.controller.js';

const router = express.Router();

// El panel nunca se cachea
router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Demasiados intentos, probá de nuevo en unos minutos" }
});

// Sesión
router.post('/login', limiteLogin, auth.login);
router.post('/logout', auth.logout);

router.use(requireAuth);
router.get('/me', auth.me);
router.put('/me/password', auth.cambiarPassword);

// Estadísticas
router.get('/stats', tablero);

// Pedidos
router.get('/pedidos', pedidos.listar);
router.get('/pedidos/:id', pedidos.detalle);
router.put('/pedidos/:id/estado', pedidos.cambiarEstado);

// Clientes registrados (exportar y desactivar: sólo administradores)
router.get('/clientes', clientes.listar);
router.get('/clientes/exportar', requireRol('admin'), clientes.exportar);
router.put('/clientes/:id/estado', requireRol('admin'), clientes.cambiarEstado);
router.post('/clientes/:id/password-temporal', requireRol('admin'), clientes.passwordTemporal);

// Productos
router.get('/productos', productos.buscar);
router.get('/productos/:id', productos.detalle);
router.put('/productos/:id', productos.guardar);
router.post('/productos/:id/imagenes', subida.array('imagenes', 10), productos.subirImagenes);
router.put('/productos/:id/imagenes/principal', productos.imagenPrincipal);
router.delete('/productos/:id/imagenes/:archivo', productos.eliminarImagen);

// Sitio: temática, GA4 y banners
const camposBanner = subida.fields([{ name: 'imagen', maxCount: 1 }, { name: 'imagenMovil', maxCount: 1 }]);
router.get('/ajustes', sitio.getAjustes);
router.put('/ajustes', sitio.guardarAjustes);
router.get('/banners', sitio.listarBanners);
router.post('/banners', camposBanner, sitio.crearBanner);
router.put('/banners/orden', sitio.ordenarBanners);
router.put('/banners/:id', camposBanner, sitio.editarBanner);
router.delete('/banners/:id', sitio.eliminarBanner);

// Usuarios del panel (sólo administradores)
router.get('/usuarios', requireRol('admin'), usuarios.listar);
router.get('/usuarios/candidatos', requireRol('admin'), usuarios.candidatosErp);
router.post('/usuarios', requireRol('admin'), usuarios.crear);
router.put('/usuarios/:id', requireRol('admin'), usuarios.editar);

// Errores de subida (tamaño, cantidad de archivos)
router.use((err, req, res, next) => {
    if (err?.name === 'MulterError') {
        const mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen supera los 15 MB' : 'Archivo no permitido';
        return res.status(400).json({ error: mensaje });
    }
    next(err);
});

export default router;
