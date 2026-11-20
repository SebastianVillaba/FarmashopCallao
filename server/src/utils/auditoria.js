// auditoria.js
// Registra los cambios hechos desde el panel. Nunca hace fallar la operación principal.
import sql from "mssql";
import { executeRequest } from "./dbHandler.js";

export const auditar = async (req, accion, detalle = null) => {
    try {
        await executeRequest({
            query: `INSERT INTO web_auditoria (idUsuarioWeb, accion, detalle) VALUES (@id, @accion, @detalle)`,
            inputs: [
                { name: 'id', type: sql.Int, value: req.usuario.idUsuarioWeb },
                { name: 'accion', type: sql.VarChar(50), value: accion },
                { name: 'detalle', type: sql.NVarChar(sql.MAX), value: detalle == null ? null : JSON.stringify(detalle) },
            ]
        });
    } catch (err) {
        console.error("No se pudo registrar la auditoría:", err.message);
    }
};
