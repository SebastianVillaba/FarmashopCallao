import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import productoRoute from './src/routes/producto.route.js'
import pedidoRoute from './src/routes/pedido.route.js'
import { iniciarIndiceImagenes, IMAGES_DIR, IMAGES_URL } from './src/utils/imageIndex.js';

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

app.use(cors(
    {
        origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(',').map(o => o.trim())
    }
));

// IMÁGENES DE PRODUCTOS (servidas desde la carpeta del servidor)
app.use(IMAGES_URL, express.static(IMAGES_DIR, { maxAge: '7d', fallthrough: false, index: false }));

// USO DE RUTAS
// Ruta de productos
app.use('/api/productos', productoRoute);

// Ruta de pedidos
app.use('/api/pedidos', pedidoRoute);

// Errores no capturados (incluye imágenes inexistentes)
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status === 404 ? 'No encontrado' : 'Error interno' });
});

// Iniciamos el servidor
iniciarIndiceImagenes().then(() => {
    app.listen(PORT, ()=> {
        // Mostrar el mensaje en consola
        console.log(`Servidor corriendo en http://localhost:${PORT}`)
    });
});
