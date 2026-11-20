// Panel: gestión de pedidos web.
import sql from "mssql";
import { z } from "zod";
import { executeRequest } from "../../utils/dbHandler.js";
import { getImagenes } from "../../utils/imageIndex.js";
import { auditar } from "../../utils/auditoria.js";

export const ESTADOS = ["pendiente", "confirmado", "preparando", "enviado", "entregado", "cancelado"];
const POR_PAGINA = 25;

export const listar = async (req, res) => {
    const estado = ESTADOS.includes(req.query.estado) ? req.query.estado : null;
    const q = String(req.query.q || "").trim().slice(0, 60);
    const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);

    const condiciones = ["1 = 1"];
    const inputs = [
        { name: "offset", type: sql.Int, value: (pagina - 1) * POR_PAGINA },
        { name: "limite", type: sql.Int, value: POR_PAGINA },
    ];
    if (estado) {
        condiciones.push("p.estado = @estado");
        inputs.push({ name: "estado", type: sql.VarChar(20), value: estado });
    }
    if (q) {
        condiciones.push("(p.nroPedido LIKE @like OR p.email LIKE @like OR p.nombre + ' ' + p.apellido LIKE @like OR p.documento LIKE @like)");
        inputs.push({ name: "like", type: sql.NVarChar(70), value: `%${q.replace(/[[%_]/g, "[$&]")}%` });
    }

    try {
        const result = await executeRequest({
            // SQL Server 2008: paginación con ROW_NUMBER (no hay OFFSET/FETCH)
            query: `SELECT * FROM (
                        SELECT p.idPedido, p.nroPedido, p.fecha, p.estado, p.nombre, p.apellido, p.email, p.telefono,
                               p.metodoEnvio, p.metodoPago, p.ciudad, p.total,
                               (SELECT SUM(cantidad) FROM web_pedido_detalle d WHERE d.idPedido = p.idPedido) AS unidades,
                               s.fuente, COUNT(*) OVER () AS totalFilas,
                               ROW_NUMBER() OVER (ORDER BY p.fecha DESC, p.idPedido DESC) AS fila
                        FROM web_pedido p
                        LEFT JOIN web_sesion s ON s.idPedido = p.idPedido
                        WHERE ${condiciones.join(" AND ")}
                    ) x
                    WHERE x.fila > @offset AND x.fila <= @offset + @limite
                    ORDER BY x.fila`,
            inputs
        });
        const total = result.recordset[0]?.totalFilas || 0;
        res.json({
            respuesta: result.recordset.map(({ totalFilas, fila, ...p }) => p),
            paginacion: { pagina, porPagina: POR_PAGINA, total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) }
        });
    } catch (err) {
        console.error("Error listando pedidos:", err);
        res.status(500).json({ error: "No se pudieron obtener los pedidos" });
    }
};

export const detalle = async (req, res) => {
    const id = /^\d+$/.test(req.params.id) ? parseInt(req.params.id) : null;
    if (!id) return res.status(400).json({ error: "Pedido inválido" });
    try {
        const [cab, det] = await Promise.all([
            executeRequest({
                query: `SELECT p.*, s.fuente, s.medio, s.campania, s.dispositivo
                        FROM web_pedido p LEFT JOIN web_sesion s ON s.idPedido = p.idPedido
                        WHERE p.idPedido = @id`,
                inputs: [{ name: "id", type: sql.Int, value: id }]
            }),
            executeRequest({
                query: `SELECT idProducto, codigo, nombre, precioUnitario, cantidad, subtotal
                        FROM web_pedido_detalle WHERE idPedido = @id ORDER BY idDetalle`,
                inputs: [{ name: "id", type: sql.Int, value: id }]
            }),
        ]);
        const pedido = cab.recordset[0];
        if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
        res.json({
            respuesta: {
                ...pedido,
                items: det.recordset.map(d => ({ ...d, imagen: getImagenes(d.codigo)[0] || null }))
            }
        });
    } catch (err) {
        console.error("Error en detalle de pedido:", err);
        res.status(500).json({ error: "No se pudo obtener el pedido" });
    }
};

const estadoSchema = z.object({ estado: z.enum(ESTADOS) });

export const cambiarEstado = async (req, res) => {
    const id = /^\d+$/.test(req.params.id) ? parseInt(req.params.id) : null;
    const parsed = estadoSchema.safeParse(req.body);
    if (!id || !parsed.success) return res.status(400).json({ error: "Datos inválidos" });
    try {
        const result = await executeRequest({
            query: `UPDATE web_pedido SET estado = @estado, fechaEstado = SYSDATETIME()
                    OUTPUT DELETED.estado AS anterior
                    WHERE idPedido = @id`,
            inputs: [
                { name: "id", type: sql.Int, value: id },
                { name: "estado", type: sql.VarChar(20), value: parsed.data.estado },
            ]
        });
        if (!result.recordset.length) return res.status(404).json({ error: "Pedido no encontrado" });
        auditar(req, "pedido.estado", { idPedido: id, de: result.recordset[0].anterior, a: parsed.data.estado });
        res.json({ mensaje: "Estado actualizado" });
    } catch (err) {
        console.error("Error cambiando estado de pedido:", err);
        res.status(500).json({ error: "No se pudo cambiar el estado" });
    }
};
