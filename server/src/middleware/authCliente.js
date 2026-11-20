// authCliente.js
// Sesión de los clientes de la tienda: JWT en una cookie httpOnly, separada de la del panel.
import crypto from "crypto";
import jwt from "jsonwebtoken";
import sql from "mssql";
import dotenv from "dotenv";
import { executeRequest } from "../utils/dbHandler.js";

dotenv.config();

export const COOKIE_CLIENTE = "fs_cliente";
const DURACION_MS = 30 * 24 * 60 * 60 * 1000;
const AUDIENCIA = "cliente";
// Secreto derivado: un token de cliente nunca es válido como sesión del panel (y viceversa)
const SECRET = process.env.JWT_SECRET
    ? crypto.createHmac("sha256", process.env.JWT_SECRET).update("sesion-cliente").digest("hex")
    : null;

const opcionesCookie = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api",
};

export const emitirSesionCliente = (res, cliente) => {
    const token = jwt.sign({ sub: cliente.idCliente, v: cliente.versionSesion ?? 0 }, SECRET, {
        expiresIn: DURACION_MS / 1000,
        audience: AUDIENCIA,
    });
    res.cookie(COOKIE_CLIENTE, token, { ...opcionesCookie, maxAge: DURACION_MS });
};

export const cerrarSesionCliente = (res) => res.clearCookie(COOKIE_CLIENTE, opcionesCookie);

export const COLUMNAS_CLIENTE = `idCliente, email, nombre, apellido, telefono, documento, dv, razonSocial,
    metodoEnvio, idSucursal, calle, calleSecundaria, referencia, ciudad,
    aceptaComunicaciones, emailVerificado, versionSesion, activo, fechaAlta`;

export const consultarCliente = async (idCliente) => {
    const result = await executeRequest({
        query: `SELECT ${COLUMNAS_CLIENTE} FROM web_cliente WHERE idCliente = @id`,
        inputs: [{ name: "id", type: sql.Int, value: idCliente }]
    });
    return result.recordset[0] || null;
};

// Devuelve el cliente de la cookie o null (token inválido, vencido, cliente inactivo o contraseña cambiada)
export const clienteDeRequest = async (req) => {
    const token = req.cookies?.[COOKIE_CLIENTE];
    if (!token || !SECRET) return null;
    let payload;
    try {
        payload = jwt.verify(token, SECRET, { audience: AUDIENCIA });
    } catch {
        return null;
    }
    const cliente = await consultarCliente(payload.sub);
    if (!cliente || !cliente.activo || cliente.versionSesion !== payload.v) return null;
    return cliente;
};

export const requireCliente = async (req, res, next) => {
    try {
        const cliente = await clienteDeRequest(req);
        if (!cliente) {
            if (req.cookies?.[COOKIE_CLIENTE]) cerrarSesionCliente(res);
            return res.status(401).json({ error: "Ingresá a tu cuenta para continuar" });
        }
        req.cliente = cliente;
        next();
    } catch (err) {
        next(err);
    }
};

// Para rutas públicas que se comportan distinto con sesión (ej.: checkout). Nunca bloquea.
export const clienteOpcional = async (req, res, next) => {
    try {
        req.cliente = await clienteDeRequest(req);
    } catch (err) {
        console.error("No se pudo leer la sesión del cliente:", err.message);
        req.cliente = null;
    }
    next();
};
