import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import productoRoute from './src/routes/producto.route.js'
import pedidoRoute from './src/routes/pedido.route.js'
import configRoute from './src/routes/config.route.js'
import trackingRoute from './src/routes/tracking.route.js'
import cuentaRoute from './src/routes/cuenta.route.js'
import adminRoute from './src/routes/admin/index.js'
import { iniciarIndiceImagenes, IMAGES_DIR, IMAGES_URL } from './src/utils/imageIndex.js';
import { iniciarOfertas } from './src/utils/ofertas.js';
import { iniciarWebProductos } from './src/utils/webProductos.js';
import { asegurarCarpetaBanners, BANNERS_DIR } from './src/utils/imagenes.js';
import { BANNERS_URL } from './src/utils/configWeb.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

// CONFIGURACIONES
app.set('trust proxy', 1);
app.use(helmet({
    // Las imágenes se consumen desde el front (otro origen en desarrollo)
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use(cors(
    {
        origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(',').map(o => o.trim()),
        credentials: true // la sesión del panel viaja en una cookie
    }
));

// IMÁGENES DE PRODUCTOS (servidas desde la carpeta del servidor)
app.use(IMAGES_URL, express.static(IMAGES_DIR, { maxAge: '7d', fallthrough: false, index: false }));

// BANNERS (subidos desde el panel; cada archivo tiene nombre único, se pueden cachear)
app.use(BANNERS_URL, express.static(BANNERS_DIR, { maxAge: '30d', immutable: true, fallthrough: false, index: false }));

// USO DE RUTAS
// Ruta de productos
app.use('/api/productos', productoRoute);

// Ruta de pedidos
app.use('/api/pedidos', pedidoRoute);

// Configuración pública (temática y banners)
app.use('/api/config', configRoute);

// Cuentas de clientes
app.use('/api/cuenta', cuentaRoute);

// Analítica propia
app.use('/api/t', trackingRoute);

// Panel administrativo
app.use('/api/admin', adminRoute);

// Errores no capturados (incluye imágenes inexistentes)
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status === 404 ? 'No encontrado' : 'Error interno' });
});

// Iniciamos el servidor
Promise.all([iniciarIndiceImagenes(), iniciarOfertas(), iniciarWebProductos(), asegurarCarpetaBanners()]).then(() => {
    app.listen(PORT, ()=> {
        // Mostrar el mensaje en consola
        console.log(`Servidor corriendo en http://localhost:${PORT}`)
    });
});
