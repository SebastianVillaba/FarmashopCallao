import express from 'express';
import { probarSql } from '../controllers/prueba.controller.js';

const router = express.Router();

// Ruta para conseguir los productos
router.get("/sql", probarSql);


export default router;