import express from 'express';
import productoController from '../controllers/producto.controller.js';

const router = express.Router();

// Ruta para conseguir los productos
router.get("/getProductos", productoController.getProducto);

// Ruta para conseguir el listado de tipo de productos
router.get("/getTipoProductos", productoController.getTipoProducto);

// Ruta para conseguir el listado de marcas por tipo de producto
router.get("/getMarcaByTipo", productoController.getMarcaByTipo);

// Ruta para conseguir producto por id
router.get("/getProductoById", productoController.getProductoById)

export default router;