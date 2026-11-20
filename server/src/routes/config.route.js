import express from 'express';
import { getConfigPublica } from '../utils/configWeb.js';

const router = express.Router();

// Configuración pública: temática vigente, banners y GA4
router.get("/", async (req, res, next) => {
    try {
        res.set('Cache-Control', 'no-cache');
        res.json({ respuesta: await getConfigPublica() });
    } catch (err) {
        next(err);
    }
});

export default router;
