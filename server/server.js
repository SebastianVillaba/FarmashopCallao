import express from 'express';
import dotenv from 'dotenv';
import productoRoute from './src/routes/producto.route.js'
import pruebaRoute from './src/routes/prueba.route.js'
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

// CONFIGURACIONES
app.use(express.json());

app.use(cors(
    {
        origin: "http://localhost:3000"
    }
));

// USO DE RUTAS
// Ruta de productos
app.use('/api/productos', productoRoute);

app.use('/api/prueba', pruebaRoute)


// Iniciamos el servidor
app.listen(PORT, ()=> {
    // Mostrar el mensaje en consola
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
});