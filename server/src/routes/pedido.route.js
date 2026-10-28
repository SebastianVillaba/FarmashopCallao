import express from 'express';
import rateLimit from 'express-rate-limit';
import pedidoController from '../controllers/pedido.controller.js';

const router = express.Router();

// Evita que se generen pedidos en masa desde una misma IP
const limitePedidos = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Demasiados pedidos, intentá de nuevo en unos minutos" }
});

// Ruta para registrar un pedido nuevo
router.post("/", limitePedidos, pedidoController.crearPedido);

// Ruta para consultar un pedido (requiere el email con el que se hizo)
router.get("/:nro", pedidoController.getPedido);

export default router;
