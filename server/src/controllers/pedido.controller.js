import sql from 'mssql';
import { z } from 'zod';
import { executeRequest, withTransaction } from "../utils/dbHandler.js";
import { getImagenes } from "../utils/imageIndex.js";

const COSTO_DELIVERY = parseInt(process.env.DELIVERY_COSTO) || 0;
const MAX_ITEMS = 50;

const texto = (max) => z.string().trim().max(max);

const pedidoSchema = z.object({
    cliente: z.object({
        nombre: texto(100).min(2),
        apellido: texto(100).min(2),
        email: z.string().trim().toLowerCase().email().max(150),
        telefono: texto(30).regex(/^[0-9+\s()-]{6,}$/, "Teléfono inválido"),
    }),
    facturacion: z.object({
        documento: texto(20).regex(/^[0-9A-Za-z.-]{3,}$/, "Documento inválido"),
        dv: texto(2).optional().or(z.literal("")),
        razonSocial: texto(150).optional().or(z.literal("")),
    }),
    envio: z.discriminatedUnion("metodo", [
        z.object({
            metodo: z.literal("retiro"),
            idSucursal: z.coerce.number().int().positive(),
            observacion: texto(500).optional(),
        }),
        z.object({
            metodo: z.literal("delivery"),
            calle: texto(150).min(3),
            calleSecundaria: texto(150).optional(),
            referencia: texto(250).optional(),
            ciudad: texto(100).min(2),
            observacion: texto(500).optional(),
        }),
    ]),
    metodoPago: z.enum(["transferencia", "qr", "contra_entrega"]),
    items: z.array(z.object({
        idProducto: z.coerce.number().int().positive(),
        cantidad: z.coerce.number().int().min(1).max(99),
    })).min(1).max(MAX_ITEMS),
});

// Consulta precio y stock reales; nunca se usa el precio que manda el navegador
const consultarProductos = async (ids) => {
    const inputs = ids.map((id, i) => ({ name: `id${i}`, type: sql.Int, value: id }));
    const result = await executeRequest({
        query: `SELECT
                    p.idProducto,
                    p.nombreProducto AS nombreMercaderia,
                    p.codigo,
                    p.precio,
                    SUM(s.cantidad) AS stockTotal
                FROM producto p
                INNER JOIN stock s ON s.idProducto = p.idProducto
                WHERE p.idProducto IN (${inputs.map(i => '@' + i.name).join(', ')})
                GROUP BY p.idProducto, p.nombreProducto, p.codigo, p.precio`,
        inputs
    });
    return new Map(result.recordset.map(p => [p.idProducto, p]));
};

export const crearPedido = async (req, res) => {
    const parsed = pedidoSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: "Datos del pedido inválidos",
            detalles: parsed.error.issues.map(i => ({ campo: i.path.join('.'), mensaje: i.message }))
        });
    }
    const { cliente, facturacion, envio, metodoPago, items } = parsed.data;

    try {
        // Unificar ítems repetidos
        const cantidades = new Map();
        for (const { idProducto, cantidad } of items) {
            cantidades.set(idProducto, (cantidades.get(idProducto) || 0) + cantidad);
        }

        const productos = await consultarProductos([...cantidades.keys()]);
        const problemas = [];
        const detalle = [];

        for (const [idProducto, cantidad] of cantidades) {
            const p = productos.get(idProducto);
            if (!p || !(p.precio > 0)) {
                problemas.push({ idProducto, motivo: "no_disponible" });
            } else if ((p.stockTotal ?? 0) < cantidad) {
                problemas.push({ idProducto, motivo: "stock_insuficiente", disponible: Math.max(0, p.stockTotal ?? 0) });
            } else {
                detalle.push({
                    idProducto,
                    codigo: p.codigo != null ? String(p.codigo).trim() : null,
                    nombre: String(p.nombreMercaderia).trim(),
                    precioUnitario: Math.round(p.precio),
                    cantidad,
                    subtotal: Math.round(p.precio) * cantidad
                });
            }
        }

        if (problemas.length) {
            return res.status(409).json({ error: "Algunos productos no están disponibles", problemas });
        }

        const subtotal = detalle.reduce((acc, d) => acc + d.subtotal, 0);
        const costoEnvio = envio.metodo === "delivery" ? COSTO_DELIVERY : 0;
        const total = subtotal + costoEnvio;

        const nroPedido = await withTransaction(async (nuevoRequest) => {
            const cabecera = await nuevoRequest()
                .input('nombre', sql.NVarChar(100), cliente.nombre)
                .input('apellido', sql.NVarChar(100), cliente.apellido)
                .input('email', sql.VarChar(150), cliente.email)
                .input('telefono', sql.VarChar(30), cliente.telefono)
                .input('documento', sql.VarChar(20), facturacion.documento)
                .input('dv', sql.VarChar(2), facturacion.dv || null)
                .input('razonSocial', sql.NVarChar(150), facturacion.razonSocial || null)
                .input('metodoEnvio', sql.VarChar(20), envio.metodo)
                .input('idSucursal', sql.Int, envio.metodo === "retiro" ? envio.idSucursal : null)
                .input('calle', sql.NVarChar(150), envio.calle || null)
                .input('calleSecundaria', sql.NVarChar(150), envio.calleSecundaria || null)
                .input('referencia', sql.NVarChar(250), envio.referencia || null)
                .input('ciudad', sql.NVarChar(100), envio.ciudad || null)
                .input('observacion', sql.NVarChar(500), envio.observacion || null)
                .input('metodoPago', sql.VarChar(20), metodoPago)
                .input('subtotal', sql.Decimal(18, 0), subtotal)
                .input('costoEnvio', sql.Decimal(18, 0), costoEnvio)
                .input('total', sql.Decimal(18, 0), total)
                .query(`INSERT INTO web_pedido
                            (nombre, apellido, email, telefono, documento, dv, razonSocial,
                             metodoEnvio, idSucursal, calle, calleSecundaria, referencia, ciudad, observacion,
                             metodoPago, subtotal, costoEnvio, total)
                        OUTPUT INSERTED.idPedido, INSERTED.nroPedido
                        VALUES
                            (@nombre, @apellido, @email, @telefono, @documento, @dv, @razonSocial,
                             @metodoEnvio, @idSucursal, @calle, @calleSecundaria, @referencia, @ciudad, @observacion,
                             @metodoPago, @subtotal, @costoEnvio, @total)`);

            const { idPedido, nroPedido } = cabecera.recordset[0];

            for (const d of detalle) {
                await nuevoRequest()
                    .input('idPedido', sql.Int, idPedido)
                    .input('idProducto', sql.Int, d.idProducto)
                    .input('codigo', sql.VarChar(50), d.codigo)
                    .input('nombre', sql.NVarChar(250), d.nombre)
                    .input('precioUnitario', sql.Decimal(18, 0), d.precioUnitario)
                    .input('cantidad', sql.Int, d.cantidad)
                    .input('subtotal', sql.Decimal(18, 0), d.subtotal)
                    .query(`INSERT INTO web_pedido_detalle
                                (idPedido, idProducto, codigo, nombre, precioUnitario, cantidad, subtotal)
                            VALUES
                                (@idPedido, @idProducto, @codigo, @nombre, @precioUnitario, @cantidad, @subtotal)`);
            }

            return nroPedido;
        });

        res.status(201).json({
            mensaje: "Pedido registrado",
            respuesta: { nroPedido, email: cliente.email, subtotal, costoEnvio, total }
        });
    } catch (err) {
        console.error("Error en crearPedido:", err);
        res.status(500).json({ error: "No se pudo registrar el pedido", mensaje: err.message });
    }
};

export const getPedido = async (req, res) => {
    try {
        const nro = String(req.params.nro || '').toUpperCase();
        const email = String(req.query.email || '').trim().toLowerCase();

        if (!/^FS-\d{6,}$/.test(nro) || !email) {
            return res.status(400).json({ error: "Número de pedido o email inválido" });
        }

        const cabecera = await executeRequest({
            query: `SELECT idPedido, nroPedido, fecha, estado, nombre, apellido, email, telefono,
                           documento, dv, razonSocial, metodoEnvio, idSucursal, calle, calleSecundaria,
                           referencia, ciudad, observacion, metodoPago, subtotal, costoEnvio, total
                    FROM web_pedido
                    WHERE nroPedido = @nro AND email = @email`,
            inputs: [
                { name: 'nro', type: sql.VarChar(20), value: nro },
                { name: 'email', type: sql.VarChar(150), value: email },
            ]
        });

        const pedido = cabecera.recordset[0];
        if (!pedido) {
            return res.status(404).json({ error: "Pedido no encontrado" });
        }

        const detalle = await executeRequest({
            query: `SELECT idProducto, codigo, nombre, precioUnitario, cantidad, subtotal
                    FROM web_pedido_detalle
                    WHERE idPedido = @idPedido
                    ORDER BY idDetalle`,
            inputs: [{ name: 'idPedido', type: sql.Int, value: pedido.idPedido }]
        });

        const { idPedido, ...resto } = pedido;
        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: {
                ...resto,
                items: detalle.recordset.map(d => ({ ...d, imagen: getImagenes(d.codigo)[0] || null }))
            }
        });
    } catch (err) {
        console.error("Error en getPedido:", err);
        res.status(500).json({ error: "Error al consultar el pedido", mensaje: err.message });
    }
};

export default { crearPedido, getPedido };
