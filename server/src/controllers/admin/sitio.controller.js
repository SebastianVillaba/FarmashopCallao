// Panel: temática, GA4 y banners de la vista del cliente.
import sql from "mssql";
import { z } from "zod";
import { executeRequest } from "../../utils/dbHandler.js";
import { BANNERS_URL, TEMAS, invalidarConfig, leerConfig, temaEfectivo } from "../../utils/configWeb.js";
import { eliminarArchivoBanner, guardarBanner } from "../../utils/imagenes.js";
import { auditar } from "../../utils/auditoria.js";

const guardarClave = (clave, valor, idUsuarioWeb) => executeRequest({
    query: `MERGE web_config AS t
            USING (SELECT @clave AS clave) AS s ON t.clave = s.clave
            WHEN MATCHED THEN UPDATE SET valor = @valor, fechaMod = SYSDATETIME(), idUsuarioWebMod = @usuario
            WHEN NOT MATCHED THEN INSERT (clave, valor, idUsuarioWebMod) VALUES (@clave, @valor, @usuario);`,
    inputs: [
        { name: "clave", type: sql.VarChar(50), value: clave },
        { name: "valor", type: sql.NVarChar(sql.MAX), value: valor },
        { name: "usuario", type: sql.Int, value: idUsuarioWeb },
    ]
});

// ---------------- Temática y ajustes ----------------

export const getAjustes = async (req, res) => {
    try {
        const config = await leerConfig();
        res.json({ respuesta: { ...config, temaVigente: temaEfectivo(config.tema, config.temaProgramado), temas: TEMAS } });
    } catch (err) {
        console.error("Error leyendo ajustes:", err);
        res.status(500).json({ error: "No se pudo leer la configuración" });
    }
};

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const ajustesSchema = z.object({
    tema: z.enum(TEMAS),
    temaProgramado: z.object({ tema: z.enum(TEMAS), desde: fecha, hasta: fecha })
        .refine(p => p.desde <= p.hasta, { message: "La fecha 'desde' debe ser anterior a 'hasta'" })
        .nullable(),
    ga4Id: z.string().trim().regex(/^G-[A-Z0-9]{4,15}$/, "El ID de GA4 tiene el formato G-XXXXXXXXXX").nullable().or(z.literal("")),
});

export const guardarAjustes = async (req, res) => {
    const parsed = ajustesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { tema, temaProgramado, ga4Id } = parsed.data;
    try {
        const id = req.usuario.idUsuarioWeb;
        await guardarClave("tema", tema, id);
        await guardarClave("tema_programado", temaProgramado ? JSON.stringify(temaProgramado) : null, id);
        await guardarClave("ga4_id", ga4Id || null, id);
        invalidarConfig();
        auditar(req, "sitio.ajustes", parsed.data);
        res.json({ mensaje: "Configuración guardada", respuesta: { temaVigente: temaEfectivo(tema, temaProgramado) } });
    } catch (err) {
        console.error("Error guardando ajustes:", err);
        res.status(500).json({ error: "No se pudo guardar la configuración" });
    }
};

// ---------------- Banners ----------------

const UBICACIONES = ["carrusel", "promo_1", "promo_2"];
const url = (archivo) => (archivo ? `${BANNERS_URL}/${encodeURIComponent(archivo)}` : null);

const aBanner = (b) => ({
    ...b,
    activo: Boolean(b.activo),
    src: url(b.archivo),
    srcMovil: url(b.archivoMovil),
});

export const listarBanners = async (req, res) => {
    try {
        const result = await executeRequest({
            query: `SELECT idBanner, ubicacion, archivo, archivoMovil, alt, link, orden, activo,
                           CONVERT(VARCHAR(10), desde, 23) AS desde, CONVERT(VARCHAR(10), hasta, 23) AS hasta, tema
                    FROM web_banner ORDER BY ubicacion, orden, idBanner`
        });
        res.json({ respuesta: result.recordset.map(aBanner) });
    } catch (err) {
        console.error("Error listando banners:", err);
        res.status(500).json({ error: "No se pudieron obtener los banners" });
    }
};

// Los campos llegan como multipart (texto) junto con las imágenes
const opcional = (v) => (v === undefined || v === null || v === "" ? null : v);
const bannerSchema = z.object({
    ubicacion: z.enum(UBICACIONES),
    alt: z.string().trim().min(2, "Ingresá una descripción del banner").max(150),
    link: z.preprocess(opcional, z.string().trim().max(300)
        .refine(l => l.startsWith("/") || /^https?:\/\//.test(l), "El link debe empezar con / o https://").nullable()),
    activo: z.preprocess(v => v === true || v === "true" || v === "1", z.boolean()),
    desde: z.preprocess(opcional, fecha.nullable()),
    hasta: z.preprocess(opcional, fecha.nullable()),
    tema: z.preprocess(opcional, z.enum(TEMAS).nullable()),
});

const inputsBanner = (d) => [
    { name: "ubicacion", type: sql.VarChar(20), value: d.ubicacion },
    { name: "alt", type: sql.NVarChar(150), value: d.alt },
    { name: "link", type: sql.NVarChar(300), value: d.link },
    { name: "activo", type: sql.Bit, value: d.activo },
    { name: "desde", type: sql.DateTime2, value: d.desde ? new Date(`${d.desde}T00:00:00`) : null },
    { name: "hasta", type: sql.DateTime2, value: d.hasta ? new Date(`${d.hasta}T23:59:59`) : null },
    { name: "tema", type: sql.VarChar(20), value: d.tema },
];

const error400 = (res, err) => res.status(err.status || 400).json({ error: err.message });

export const crearBanner = async (req, res) => {
    const parsed = bannerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const desktop = req.files?.imagen?.[0];
    const movil = req.files?.imagenMovil?.[0];
    if (!desktop) return res.status(400).json({ error: "Subí la imagen del banner" });

    let archivo, archivoMovil;
    try {
        archivo = await guardarBanner(desktop.buffer);
        archivoMovil = movil ? await guardarBanner(movil.buffer, true) : null;
    } catch (err) {
        await eliminarArchivoBanner(archivo);
        return error400(res, err);
    }

    try {
        const result = await executeRequest({
            query: `INSERT INTO web_banner (ubicacion, archivo, archivoMovil, alt, link, activo, desde, hasta, tema, orden)
                    OUTPUT INSERTED.idBanner
                    VALUES (@ubicacion, @archivo, @archivoMovil, @alt, @link, @activo, @desde, @hasta, @tema,
                            (SELECT ISNULL(MAX(orden), 0) + 1 FROM web_banner WHERE ubicacion = @ubicacion))`,
            inputs: [
                ...inputsBanner(parsed.data),
                { name: "archivo", type: sql.VarChar(100), value: archivo },
                { name: "archivoMovil", type: sql.VarChar(100), value: archivoMovil },
            ]
        });
        invalidarConfig();
        auditar(req, "banner.crear", { idBanner: result.recordset[0].idBanner, ...parsed.data });
        res.status(201).json({ mensaje: "Banner creado" });
    } catch (err) {
        await eliminarArchivoBanner(archivo);
        await eliminarArchivoBanner(archivoMovil);
        console.error("Error creando banner:", err);
        res.status(500).json({ error: "No se pudo crear el banner" });
    }
};

const idValido = (v) => (/^\d+$/.test(String(v)) ? parseInt(v) : null);

const consultarBanner = async (id) => (await executeRequest({
    query: `SELECT idBanner, archivo, archivoMovil FROM web_banner WHERE idBanner = @id`,
    inputs: [{ name: "id", type: sql.Int, value: id }]
})).recordset[0];

export const editarBanner = async (req, res) => {
    const id = idValido(req.params.id);
    const parsed = bannerSchema.safeParse(req.body);
    if (!id) return res.status(400).json({ error: "Banner inválido" });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    try {
        const actual = await consultarBanner(id);
        if (!actual) return res.status(404).json({ error: "Banner no encontrado" });

        const desktop = req.files?.imagen?.[0];
        const movil = req.files?.imagenMovil?.[0];
        const quitarMovil = req.body.quitarMovil === "true";
        let archivo = actual.archivo;
        let archivoMovil = quitarMovil ? null : actual.archivoMovil;
        try {
            if (desktop) archivo = await guardarBanner(desktop.buffer);
            if (movil) archivoMovil = await guardarBanner(movil.buffer, true);
        } catch (err) {
            if (archivo !== actual.archivo) await eliminarArchivoBanner(archivo);
            return error400(res, err);
        }

        await executeRequest({
            query: `UPDATE web_banner SET ubicacion = @ubicacion, alt = @alt, link = @link, activo = @activo,
                           desde = @desde, hasta = @hasta, tema = @tema, archivo = @archivo, archivoMovil = @archivoMovil
                    WHERE idBanner = @id`,
            inputs: [
                ...inputsBanner(parsed.data),
                { name: "id", type: sql.Int, value: id },
                { name: "archivo", type: sql.VarChar(100), value: archivo },
                { name: "archivoMovil", type: sql.VarChar(100), value: archivoMovil },
            ]
        });

        // Borra los archivos reemplazados
        if (archivo !== actual.archivo) await eliminarArchivoBanner(actual.archivo);
        if (archivoMovil !== actual.archivoMovil) await eliminarArchivoBanner(actual.archivoMovil);

        invalidarConfig();
        auditar(req, "banner.editar", { idBanner: id, ...parsed.data });
        res.json({ mensaje: "Banner actualizado" });
    } catch (err) {
        console.error("Error editando banner:", err);
        res.status(500).json({ error: "No se pudo actualizar el banner" });
    }
};

export const eliminarBanner = async (req, res) => {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ error: "Banner inválido" });
    try {
        const actual = await consultarBanner(id);
        if (!actual) return res.status(404).json({ error: "Banner no encontrado" });
        await executeRequest({
            query: `DELETE FROM web_banner WHERE idBanner = @id`,
            inputs: [{ name: "id", type: sql.Int, value: id }]
        });
        await eliminarArchivoBanner(actual.archivo);
        await eliminarArchivoBanner(actual.archivoMovil);
        invalidarConfig();
        auditar(req, "banner.eliminar", { idBanner: id });
        res.json({ mensaje: "Banner eliminado" });
    } catch (err) {
        console.error("Error eliminando banner:", err);
        res.status(500).json({ error: "No se pudo eliminar el banner" });
    }
};

const ordenSchema = z.object({ ids: z.array(z.number().int().positive()).min(1).max(100) });

export const ordenarBanners = async (req, res) => {
    const parsed = ordenSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Orden inválido" });
    try {
        const inputs = parsed.data.ids.map((id, i) => ({ name: `id${i}`, type: sql.Int, value: id }));
        await executeRequest({
            query: parsed.data.ids.map((_, i) => `UPDATE web_banner SET orden = ${i + 1} WHERE idBanner = @id${i};`).join("\n"),
            inputs
        });
        invalidarConfig();
        res.json({ mensaje: "Orden guardado" });
    } catch (err) {
        console.error("Error ordenando banners:", err);
        res.status(500).json({ error: "No se pudo guardar el orden" });
    }
};
