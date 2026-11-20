// tracking.controller.js
// Analítica propia y liviana: sesiones (con su fuente de tráfico) y eventos del embudo de compra.
// No guarda IP ni datos personales.
import sql from "mssql";
import { z } from "zod";
import { executeRequest } from "../utils/dbHandler.js";

const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse|pingdom|monitor/i;

const BUSCADORES = ["google", "bing", "yahoo", "duckduckgo", "ecosia", "yandex", "baidu"];
const REDES = [
    ["facebook", "facebook"], ["fb.com", "facebook"], ["fb.me", "facebook"],
    ["instagram", "instagram"], ["tiktok", "tiktok"], ["t.co", "twitter"], ["twitter", "twitter"],
    ["x.com", "twitter"], ["youtube", "youtube"], ["linkedin", "linkedin"], ["pinterest", "pinterest"],
];

const recortar = (v, max) => (v == null ? null : String(v).slice(0, max));
const normalizar = (v) => String(v || "").trim().toLowerCase().slice(0, 50) || null;

const hostDe = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
};

// Determina fuente / medio / campaña a partir de UTM, click-ids y referrer
export const clasificarFuente = ({ utmSource, utmMedium, utmCampaign, gclid, fbclid, referrer }, hostPropio) => {
    if (utmSource) {
        return { fuente: normalizar(utmSource), medio: normalizar(utmMedium) || "campaña", campania: recortar(utmCampaign, 100) };
    }
    if (gclid) return { fuente: "google", medio: "cpc", campania: recortar(utmCampaign, 100) };
    if (fbclid) return { fuente: "facebook", medio: "social", campania: recortar(utmCampaign, 100) };

    const host = hostDe(referrer);
    if (!host || host === hostPropio) return { fuente: "directo", medio: null, campania: null };

    const buscador = BUSCADORES.find(b => host.split(".").includes(b));
    if (buscador) return { fuente: buscador, medio: "organico", campania: null };
    if (host === "wa.me" || host.includes("whatsapp")) return { fuente: "whatsapp", medio: "social", campania: null };
    const red = REDES.find(([clave]) => host === clave || host.endsWith(`.${clave}`) || host.split(".").includes(clave));
    if (red) return { fuente: red[1], medio: "social", campania: null };
    return { fuente: host.slice(0, 50), medio: "referido", campania: null };
};

const dispositivo = (ua = "") => /tablet|ipad/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "movil" : "desktop";

const eventoSchema = z.object({
    tipo: z.enum(["page_view", "view_item", "search", "add_to_cart", "begin_checkout"]),
    ruta: z.string().max(300).optional(),
    idProducto: z.coerce.number().int().positive().optional(),
    termino: z.string().max(100).optional(),
    resultados: z.coerce.number().int().min(0).optional(),
    valor: z.coerce.number().min(0).max(1e12).optional(),
});

const loteSchema = z.object({
    visitanteId: z.string().uuid(),
    idSesion: z.string().uuid(),
    sesion: z.object({
        landing: z.string().max(300).optional(),
        referrer: z.string().max(300).optional(),
        utmSource: z.string().max(100).optional(),
        utmMedium: z.string().max(100).optional(),
        utmCampaign: z.string().max(100).optional(),
        gclid: z.string().max(300).optional(),
        fbclid: z.string().max(300).optional(),
    }).optional(),
    eventos: z.array(eventoSchema).max(30),
});

export const registrarEventos = async (req, res) => {
    // sendBeacon puede llegar como texto plano
    let body = req.body;
    if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { return res.status(204).end(); }
    }

    const ua = req.get("user-agent") || "";
    const parsed = loteSchema.safeParse(body);
    if (BOTS.test(ua) || !parsed.success) return res.status(204).end();
    const { visitanteId, idSesion, sesion = {}, eventos } = parsed.data;

    try {
        const hostPropio = hostDe(req.get("origin") || req.get("referer")) || req.hostname;
        const { fuente, medio, campania } = clasificarFuente(sesion, hostPropio);

        // Crea la sesión si no existe, si no sólo actualiza la última actividad
        await executeRequest({
            query: `IF EXISTS (SELECT 1 FROM web_sesion WHERE idSesion = @idSesion)
                        UPDATE web_sesion SET ultimoEvento = SYSDATETIME() WHERE idSesion = @idSesion
                    ELSE
                        INSERT INTO web_sesion (idSesion, visitanteId, landing, referrer, fuente, medio, campania, dispositivo)
                        VALUES (@idSesion, @visitanteId, @landing, @referrer, @fuente, @medio, @campania, @dispositivo)`,
            inputs: [
                { name: "idSesion", type: sql.UniqueIdentifier, value: idSesion },
                { name: "visitanteId", type: sql.UniqueIdentifier, value: visitanteId },
                { name: "landing", type: sql.NVarChar(300), value: recortar(sesion.landing, 300) },
                { name: "referrer", type: sql.NVarChar(300), value: recortar(sesion.referrer, 300) },
                { name: "fuente", type: sql.VarChar(50), value: fuente || "directo" },
                { name: "medio", type: sql.VarChar(50), value: medio },
                { name: "campania", type: sql.NVarChar(100), value: campania },
                { name: "dispositivo", type: sql.VarChar(10), value: dispositivo(ua) },
            ]
        });

        if (eventos.length) {
            const inputs = [{ name: "idSesion", type: sql.UniqueIdentifier, value: idSesion }];
            const filas = eventos.map((e, i) => {
                inputs.push(
                    { name: `t${i}`, type: sql.VarChar(20), value: e.tipo },
                    { name: `r${i}`, type: sql.NVarChar(300), value: recortar(e.ruta, 300) },
                    { name: `p${i}`, type: sql.Int, value: e.idProducto ?? null },
                    { name: `q${i}`, type: sql.NVarChar(100), value: e.termino ? e.termino.trim().toLowerCase() : null },
                    { name: `n${i}`, type: sql.Int, value: e.resultados ?? null },
                    { name: `v${i}`, type: sql.Decimal(18, 0), value: e.valor ?? null },
                );
                return `(@idSesion, @t${i}, @r${i}, @p${i}, @q${i}, @n${i}, @v${i})`;
            });
            await executeRequest({
                query: `INSERT INTO web_evento (idSesion, tipo, ruta, idProducto, termino, resultados, valor)
                        VALUES ${filas.join(", ")}`,
                inputs
            });
        }
        res.status(204).end();
    } catch (err) {
        console.error("Error registrando eventos:", err.message);
        res.status(204).end();
    }
};

// Asocia el pedido a la sesión que lo generó y registra la compra
export const vincularPedido = async (idSesion, idPedido, total) => {
    await executeRequest({
        query: `UPDATE web_sesion SET idPedido = @idPedido, ultimoEvento = SYSDATETIME()
                WHERE idSesion = @idSesion AND idPedido IS NULL;
                IF @@ROWCOUNT > 0
                    INSERT INTO web_evento (idSesion, tipo, valor) VALUES (@idSesion, 'purchase', @total);`,
        inputs: [
            { name: "idSesion", type: sql.UniqueIdentifier, value: idSesion },
            { name: "idPedido", type: sql.Int, value: idPedido },
            { name: "total", type: sql.Decimal(18, 0), value: total },
        ]
    });
};
