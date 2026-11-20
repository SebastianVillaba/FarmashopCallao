// Panel: clientes registrados en la tienda y exportación para comunicaciones.
import crypto from "crypto";
import bcrypt from "bcryptjs";
import sql from "mssql";
import { z } from "zod";
import { executeRequest } from "../../utils/dbHandler.js";
import { auditar } from "../../utils/auditoria.js";

const POR_PAGINA = 25;

// Filtros comunes al listado y a la exportación
const filtros = (query) => {
    const q = String(query.q || "").trim().slice(0, 60);
    const condiciones = ["1 = 1"];
    const inputs = [];
    if (query.comunicaciones === "1") condiciones.push("c.aceptaComunicaciones = 1");
    if (query.comunicaciones === "0") condiciones.push("c.aceptaComunicaciones = 0");
    if (query.activo !== "todos") condiciones.push("c.activo = 1");
    if (q) {
        condiciones.push("(c.email LIKE @like OR c.nombre + ' ' + c.apellido LIKE @like OR c.telefono LIKE @like OR c.documento LIKE @like)");
        inputs.push({ name: "like", type: sql.NVarChar(70), value: `%${q.replace(/[[%_]/g, "[$&]")}%` });
    }
    return { where: condiciones.join(" AND "), inputs };
};

// OUTER APPLY: en SQL Server 2008 no se puede agregar sobre subconsultas en el SELECT
const CONSULTA_BASE = (where) => `
    SELECT c.idCliente, c.email, c.nombre, c.apellido, c.telefono, c.documento, c.ciudad,
           c.aceptaComunicaciones, c.fechaConsentimiento, c.emailVerificado, c.activo,
           c.fechaAlta, c.ultimoLogin,
           ISNULL(ped.cantidad, 0) AS pedidos, ISNULL(ped.total, 0) AS totalComprado, ped.ultimo AS ultimoPedido
    FROM web_cliente c
    OUTER APPLY (
        SELECT COUNT(*) AS cantidad, SUM(p.total) AS total, MAX(p.fecha) AS ultimo
        FROM web_pedido p
        WHERE p.idCliente = c.idCliente AND p.estado <> 'cancelado'
    ) ped
    WHERE ${where}`;

const normalizar = (c) => ({
    ...c,
    aceptaComunicaciones: Boolean(c.aceptaComunicaciones),
    emailVerificado: Boolean(c.emailVerificado),
    activo: Boolean(c.activo),
});

export const listar = async (req, res) => {
    const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
    const { where, inputs } = filtros(req.query);
    inputs.push(
        { name: "offset", type: sql.Int, value: (pagina - 1) * POR_PAGINA },
        { name: "limite", type: sql.Int, value: POR_PAGINA },
    );
    try {
        const [result, resumen] = await Promise.all([
            executeRequest({
                query: `SELECT * FROM (
                            SELECT b.*, COUNT(*) OVER () AS totalFilas,
                                   ROW_NUMBER() OVER (ORDER BY b.fechaAlta DESC, b.idCliente DESC) AS fila
                            FROM (${CONSULTA_BASE(where)}) b
                        ) x
                        WHERE x.fila > @offset AND x.fila <= @offset + @limite
                        ORDER BY x.fila`,
                inputs
            }),
            executeRequest({
                query: `SELECT COUNT(*) AS total,
                               SUM(CASE WHEN aceptaComunicaciones = 1 THEN 1 ELSE 0 END) AS conConsentimiento,
                               SUM(CASE WHEN fechaAlta >= DATEADD(DAY, -30, SYSDATETIME()) THEN 1 ELSE 0 END) AS ultimos30
                        FROM web_cliente WHERE activo = 1`
            }),
        ]);
        const total = result.recordset[0]?.totalFilas || 0;
        res.json({
            respuesta: result.recordset.map(({ totalFilas, fila, ...c }) => normalizar(c)),
            resumen: resumen.recordset[0],
            paginacion: { pagina, porPagina: POR_PAGINA, total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) }
        });
    } catch (err) {
        console.error("Error listando clientes:", err);
        res.status(500).json({ error: "No se pudieron obtener los clientes" });
    }
};

// CSV para herramientas de email / WhatsApp. Por defecto sólo quienes aceptaron recibir promociones.
const celdaCsv = (v) => {
    if (v == null) return "";
    let s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
    // Evita inyección de fórmulas al abrir el CSV en Excel
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const exportar = async (req, res) => {
    const query = { ...req.query, comunicaciones: req.query.comunicaciones ?? "1" };
    const { where, inputs } = filtros(query);
    try {
        const result = await executeRequest({
            query: `${CONSULTA_BASE(where)} ORDER BY c.fechaAlta DESC`,
            inputs
        });
        const columnas = [
            ["nombre", "Nombre"], ["apellido", "Apellido"], ["email", "Email"], ["telefono", "Celular"],
            ["ciudad", "Ciudad"], ["aceptaComunicaciones", "Acepta promociones"], ["fechaConsentimiento", "Fecha consentimiento"],
            ["pedidos", "Pedidos"], ["totalComprado", "Total comprado"], ["ultimoPedido", "Último pedido"], ["fechaAlta", "Alta"],
        ];
        const filas = result.recordset.map(c => columnas.map(([k]) => {
            if (k === "aceptaComunicaciones") return c[k] ? "Sí" : "No";
            return celdaCsv(c[k]);
        }).join(";"));
        // BOM + ";" para que Excel en español lo abra directo con acentos y columnas
        const csv = "﻿" + [columnas.map(([, t]) => t).join(";"), ...filas].join("\r\n");

        await auditar(req, "exportar_clientes", { filas: filas.length, filtros: { q: query.q || null, comunicaciones: query.comunicaciones } });
        const fecha = new Date().toISOString().slice(0, 10);
        res.set({
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="clientes-farmashop-${fecha}.csv"`,
        });
        res.send(csv);
    } catch (err) {
        console.error("Error exportando clientes:", err);
        res.status(500).json({ error: "No se pudo exportar" });
    }
};

const estadoSchema = z.object({ activo: z.boolean() });

// Desactivar bloquea el ingreso y cierra las sesiones abiertas del cliente
export const cambiarEstado = async (req, res) => {
    const id = /^\d+$/.test(req.params.id) ? parseInt(req.params.id) : null;
    const parsed = estadoSchema.safeParse(req.body);
    if (!id || !parsed.success) return res.status(400).json({ error: "Datos inválidos" });
    try {
        const result = await executeRequest({
            query: `UPDATE web_cliente
                    SET activo = @activo, versionSesion = versionSesion + CASE WHEN @activo = 0 THEN 1 ELSE 0 END
                    WHERE idCliente = @id`,
            inputs: [
                { name: "id", type: sql.Int, value: id },
                { name: "activo", type: sql.Bit, value: parsed.data.activo },
            ]
        });
        if (!result.rowsAffected[0]) return res.status(404).json({ error: "Cliente no encontrado" });
        await auditar(req, parsed.data.activo ? "activar_cliente" : "desactivar_cliente", { idCliente: id });
        res.json({ mensaje: parsed.data.activo ? "Cliente activado" : "Cliente desactivado" });
    } catch (err) {
        console.error("Error cambiando estado de cliente:", err);
        res.status(500).json({ error: "No se pudo actualizar el cliente" });
    }
};

// Contraseña temporal para un cliente que olvidó la suya (hasta que exista el reseteo por email).
// Se muestra una sola vez en el panel; el personal la envía al celular registrado del cliente.
const ALFABETO = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const passwordTemporal = async (req, res) => {
    const id = /^\d+$/.test(req.params.id) ? parseInt(req.params.id) : null;
    if (!id) return res.status(400).json({ error: "Cliente inválido" });
    const temporal = Array.from(crypto.randomBytes(10), b => ALFABETO[b % ALFABETO.length]).join("");
    try {
        const result = await executeRequest({
            query: `UPDATE web_cliente
                    SET passwordHash = @hash, versionSesion = versionSesion + 1, intentosFallidos = 0, bloqueadoHasta = NULL
                    WHERE idCliente = @id AND activo = 1`,
            inputs: [
                { name: "id", type: sql.Int, value: id },
                { name: "hash", type: sql.VarChar(255), value: await bcrypt.hash(temporal, 12) },
            ]
        });
        if (!result.rowsAffected[0]) return res.status(404).json({ error: "Cliente no encontrado o inactivo" });
        await auditar(req, "password_temporal_cliente", { idCliente: id });
        res.json({ respuesta: { password: temporal } });
    } catch (err) {
        console.error("Error generando contraseña temporal:", err);
        res.status(500).json({ error: "No se pudo generar la contraseña" });
    }
};
