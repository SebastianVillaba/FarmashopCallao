// auth.js
// Sesión del panel: JWT firmado en una cookie httpOnly.
import jwt from "jsonwebtoken";
import sql from "mssql";
import dotenv from "dotenv";
import { executeRequest } from "../utils/dbHandler.js";

dotenv.config();

export const COOKIE = "fs_admin";
const DURACION_MS = 8 * 60 * 60 * 1000;
const SECRET = process.env.JWT_SECRET;

if (!SECRET || SECRET.length < 32) {
    console.warn("ATENCIÓN: JWT_SECRET no está definido o es muy corto (mín. 32 caracteres). El panel admin no va a funcionar.");
}

export const opcionesCookie = {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin",
};

export const emitirSesion = (res, usuario) => {
    const token = jwt.sign({ sub: usuario.idUsuarioWeb, rol: usuario.rol }, SECRET, { expiresIn: DURACION_MS / 1000 });
    res.cookie(COOKIE, token, { ...opcionesCookie, maxAge: DURACION_MS });
};

export const cerrarSesion = (res) => res.clearCookie(COOKIE, opcionesCookie);

// Datos del usuario del panel junto con su nombre en el ERP
export const consultarUsuarioWeb = async (idUsuarioWeb) => {
    const result = await executeRequest({
        query: `SELECT uw.idUsuarioWeb, uw.idUsuario, uw.rol, uw.activo AS activoWeb,
                       u.activo AS activoErp, RTRIM(u.nick) AS nick,
                       RTRIM(v.nombre) AS nombre, RTRIM(v.apellido) AS apellido
                FROM usuarioWeb uw
                INNER JOIN usuario u ON u.idUsuario = uw.idUsuario
                LEFT JOIN v_usuario v ON v.idUsuario = uw.idUsuario
                WHERE uw.idUsuarioWeb = @id`,
        inputs: [{ name: "id", type: sql.Int, value: idUsuarioWeb }]
    });
    return result.recordset[0] || null;
};

// Verifica el token y que el usuario siga activo (en la web y en el ERP)
export const requireAuth = async (req, res, next) => {
    const token = req.cookies?.[COOKIE];
    if (!token || !SECRET) return res.status(401).json({ error: "Sesión requerida" });

    let payload;
    try {
        payload = jwt.verify(token, SECRET);
    } catch {
        cerrarSesion(res);
        return res.status(401).json({ error: "Sesión vencida, ingresá de nuevo" });
    }

    try {
        const usuario = await consultarUsuarioWeb(payload.sub);
        if (!usuario || !usuario.activoWeb || !usuario.activoErp) {
            cerrarSesion(res);
            return res.status(401).json({ error: "Usuario deshabilitado" });
        }
        req.usuario = usuario;
        next();
    } catch (err) {
        next(err);
    }
};

export const requireRol = (rol) => (req, res, next) =>
    req.usuario?.rol === rol ? next() : res.status(403).json({ error: "No tenés permiso para esta acción" });
