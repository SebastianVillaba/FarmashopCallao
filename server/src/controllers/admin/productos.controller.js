// Panel: enriquecer productos del ERP (fotos, descripción, visibilidad, destacado y precios web).
// El alta / baja de productos sigue haciéndose en el ERP.
import sql from "mssql";
import { z } from "zod";
import { executeRequest } from "../../utils/dbHandler.js";
import { getArchivosImagen, getImagenes } from "../../utils/imageIndex.js";
import { eliminarImagenProducto, guardarImagenProducto, marcarPrincipal } from "../../utils/imagenes.js";
import { asegurarWebProductos, precioWeb, refrescarWebProductos } from "../../utils/webProductos.js";
import { asegurarOfertas } from "../../utils/ofertas.js";
import { auditar } from "../../utils/auditoria.js";

const COLUMNAS = `
    p.idProducto,
    RTRIM(p.codigo) AS codigo,
    RTRIM(p.codigoBarra) AS codigoBarra,
    RTRIM(p.nombreProducto) AS nombre,
    RTRIM(lb.nombre) AS laboratorio,
    CAST(p.precio AS DECIMAL(18,0)) AS precioErp,
    p.activo,
    ISNULL(st.stock, 0) AS stock,
    wp.descripcionWeb, wp.visible, wp.destacado, wp.precioRecomendado, wp.precioFarmashop, wp.fechaMod`;

const DESDE = `
    FROM producto p
    LEFT JOIN v_laboratorio lb ON lb.idLaboratorio = p.idLaboratorio
    OUTER APPLY (SELECT SUM(s.cantidad) AS stock FROM stock s WHERE s.idProducto = p.idProducto) st
    LEFT JOIN web_producto wp ON wp.idProducto = p.idProducto`;

// Archivo + URL (con versión) de cada imagen del producto
const imagenesDe = (codigo) => {
    const urls = getImagenes(codigo);
    return getArchivosImagen(codigo).map((archivo, i) => ({ archivo, url: urls[i] }));
};

const aRespuesta = (r) => {
    const web = precioWeb(r.idProducto, r.precioErp);
    return {
        idProducto: r.idProducto,
        codigo: r.codigo,
        codigoBarra: r.codigoBarra || null,
        nombre: r.nombre,
        laboratorio: r.laboratorio || null,
        activoErp: Boolean(r.activo),
        stock: Number(r.stock) || 0,
        precioErp: Number(r.precioErp) || 0,
        descripcionWeb: r.descripcionWeb || "",
        visible: r.visible == null ? true : Boolean(r.visible),
        destacado: Boolean(r.destacado),
        precioRecomendado: r.precioRecomendado != null ? Number(r.precioRecomendado) : null,
        precioFarmashop: r.precioFarmashop != null ? Number(r.precioFarmashop) : null,
        precioPublicado: web.precio,
        precioTachado: web.precioAnterior,
        imagenes: imagenesDe(r.codigo),
        fechaMod: r.fechaMod || null,
    };
};

const FILTROS = {
    destacados: "wp.destacado = 1",
    ocultos: "wp.visible = 0",
    precio_web: "wp.precioFarmashop IS NOT NULL",
    editados: "wp.idProducto IS NOT NULL",
};

export const buscar = async (req, res) => {
    const q = String(req.query.q || "").trim().slice(0, 60);
    const filtro = FILTROS[req.query.filtro] ? req.query.filtro : null;
    const sinFoto = req.query.filtro === "sin_foto";

    if (!q && !filtro && !sinFoto) return res.json({ respuesta: [] });

    try {
        await Promise.all([asegurarOfertas(), asegurarWebProductos()]);
        const condiciones = ["p.activo = 1"];
        const inputs = [];
        if (q) {
            condiciones.push("(RTRIM(p.codigo) = @q OR RTRIM(p.codigoBarra) = @q OR p.nombreProducto LIKE @like)");
            inputs.push(
                { name: "q", type: sql.NVarChar(60), value: q },
                { name: "like", type: sql.NVarChar(70), value: `%${q.replace(/[[%_]/g, "[$&]")}%` },
            );
        }
        if (filtro) condiciones.push(FILTROS[filtro]);
        if (sinFoto) condiciones.push("ISNULL(st.stock, 0) > 0");

        const result = await executeRequest({
            query: `SELECT TOP ${sinFoto ? 2000 : 50} ${COLUMNAS} ${DESDE}
                    WHERE ${condiciones.join(" AND ")}
                    ORDER BY ${q ? "CASE WHEN RTRIM(p.codigo) = @q OR RTRIM(p.codigoBarra) = @q THEN 0 ELSE 1 END," : ""}
                             CASE WHEN ISNULL(st.stock, 0) > 0 THEN 0 ELSE 1 END, p.nombreProducto`,
            inputs
        });

        let filas = result.recordset.map(aRespuesta);
        if (sinFoto) filas = filas.filter(p => !p.imagenes.length).slice(0, 100);
        res.json({ respuesta: filas });
    } catch (err) {
        console.error("Error buscando productos (admin):", err);
        res.status(500).json({ error: "No se pudo buscar productos" });
    }
};

const idValido = (valor) => (/^\d+$/.test(String(valor)) ? parseInt(valor) : null);

const consultarProducto = async (idProducto) => {
    const result = await executeRequest({
        query: `SELECT ${COLUMNAS} ${DESDE} WHERE p.idProducto = @id`,
        inputs: [{ name: "id", type: sql.Int, value: idProducto }]
    });
    return result.recordset[0] || null;
};

export const detalle = async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ error: "Producto inválido" });
    try {
        await Promise.all([asegurarOfertas(), asegurarWebProductos()]);
        const fila = await consultarProducto(id);
        if (!fila) return res.status(404).json({ error: "Producto no encontrado" });
        res.json({ respuesta: aRespuesta(fila) });
    } catch (err) {
        console.error("Error en detalle de producto (admin):", err);
        res.status(500).json({ error: "No se pudo obtener el producto" });
    }
};

const precio = z.union([z.coerce.number().int().positive().max(1e10), z.null()]);

const datosSchema = z.object({
    descripcionWeb: z.string().max(8000).nullable().optional(),
    visible: z.boolean(),
    destacado: z.boolean(),
    precioRecomendado: precio,
    precioFarmashop: precio,
}).refine(
    d => d.precioFarmashop == null || d.precioRecomendado == null || d.precioFarmashop < d.precioRecomendado,
    { message: "El precio Farmashop debe ser menor que el precio recomendado", path: ["precioFarmashop"] }
);

export const guardar = async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ error: "Producto inválido" });
    const parsed = datosSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const d = parsed.data;

    try {
        const anterior = await consultarProducto(id);
        if (!anterior) return res.status(404).json({ error: "Producto no encontrado" });

        await executeRequest({
            query: `MERGE web_producto AS t
                    USING (SELECT @id AS idProducto) AS s ON t.idProducto = s.idProducto
                    WHEN MATCHED THEN UPDATE SET
                        descripcionWeb = @descripcion, visible = @visible, destacado = @destacado,
                        precioRecomendado = @recomendado, precioFarmashop = @farmashop,
                        fechaMod = SYSDATETIME(), idUsuarioWebMod = @usuario
                    WHEN NOT MATCHED THEN INSERT
                        (idProducto, descripcionWeb, visible, destacado, precioRecomendado, precioFarmashop, idUsuarioWebMod)
                        VALUES (@id, @descripcion, @visible, @destacado, @recomendado, @farmashop, @usuario);`,
            inputs: [
                { name: "id", type: sql.Int, value: id },
                { name: "descripcion", type: sql.NVarChar(sql.MAX), value: d.descripcionWeb?.trim() || null },
                { name: "visible", type: sql.Bit, value: d.visible },
                { name: "destacado", type: sql.Bit, value: d.destacado },
                { name: "recomendado", type: sql.Decimal(18, 0), value: d.precioRecomendado },
                { name: "farmashop", type: sql.Decimal(18, 0), value: d.precioFarmashop },
                { name: "usuario", type: sql.Int, value: req.usuario.idUsuarioWeb },
            ]
        });

        auditar(req, "producto.guardar", {
            idProducto: id,
            antes: {
                visible: anterior.visible, destacado: anterior.destacado,
                precioRecomendado: anterior.precioRecomendado, precioFarmashop: anterior.precioFarmashop,
            },
            despues: { visible: d.visible, destacado: d.destacado, precioRecomendado: d.precioRecomendado, precioFarmashop: d.precioFarmashop },
        });

        await refrescarWebProductos();
        res.json({ mensaje: "Producto actualizado", respuesta: aRespuesta(await consultarProducto(id)) });
    } catch (err) {
        console.error("Error guardando producto (admin):", err);
        res.status(500).json({ error: "No se pudo guardar el producto" });
    }
};

// Envuelve las operaciones de imágenes (comparten validación y respuesta)
const conProducto = (accion) => async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ error: "Producto inválido" });
    try {
        const fila = await consultarProducto(id);
        if (!fila) return res.status(404).json({ error: "Producto no encontrado" });
        await accion(req, fila);
        res.json({ respuesta: imagenesDe(fila.codigo) });
    } catch (err) {
        if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
        console.error("Error con imágenes de producto:", err);
        res.status(500).json({ error: "No se pudo procesar la imagen" });
    }
};

export const subirImagenes = conProducto(async (req, fila) => {
    if (!req.files?.length) {
        const err = new Error("No se recibió ninguna imagen");
        err.status = 400;
        throw err;
    }
    let archivos = [];
    for (const f of req.files) archivos = await guardarImagenProducto(fila.codigo, f.buffer);
    auditar(req, "producto.imagen.subir", { idProducto: fila.idProducto, cantidad: req.files.length });
    return archivos;
});

export const eliminarImagen = conProducto(async (req, fila) => {
    const archivos = await eliminarImagenProducto(fila.codigo, req.params.archivo);
    auditar(req, "producto.imagen.eliminar", { idProducto: fila.idProducto, archivo: req.params.archivo });
    return archivos;
});

export const imagenPrincipal = conProducto(async (req, fila) => {
    const archivo = String(req.body?.archivo || "");
    return marcarPrincipal(fila.codigo, archivo);
});
