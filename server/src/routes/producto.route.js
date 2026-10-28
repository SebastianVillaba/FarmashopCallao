import express from 'express';
import productoController from '../controllers/producto.controller.js';

const router = express.Router();

// Ruta para conseguir los productos
router.get("/getProductos", productoController.getProducto);

// Ruta para productos destacados de la home (con stock e imagen)
router.get("/destacados", productoController.getDestacados);

// Ruta para conseguir el listado de tipo de productos
router.get("/getCategorias", productoController.getCategorias);

// Ruta para conseguir el listado de marcas por tipo de producto
router.get("/getMarcaByTipo", productoController.getMarcaByTipo);

// Ruta para conseguir producto por id
router.get("/getProductoById", productoController.getProductoById);

// Ruta para busqueda del searchbar por nombre
router.get("/buscarProducto", productoController.getProductoByNombre);

// Ruta para buscar producto por categoria
router.get("/buscarProductoCategoria", productoController.getProductoByCategoria)

export default router;