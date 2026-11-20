import express from 'express';
import rateLimit from 'express-rate-limit';
import { registrarEventos } from '../controllers/tracking.controller.js';

const router = express.Router();

const limite = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => res.status(204).end()
});

// navigator.sendBeacon envía texto plano
router.post("/", limite, express.text({ type: 'text/plain', limit: '20kb' }), registrarEventos);

export default router;
