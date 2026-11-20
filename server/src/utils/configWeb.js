// configWeb.js
// Configuración pública de la web (temática y banners) con caché corto.
// La temática es global: la define el panel y la ven todos los dispositivos por igual.
import { executeRequest } from "./dbHandler.js";

export const TEMAS = ["default", "navidad", "halloween", "cyberday"];
export const BANNERS_URL = "/media/banners";
const TTL_MS = 60 * 1000;

let cache = { fecha: 0, data: null };
let pendiente = null;

const leerJson = (texto) => {
    try { return texto ? JSON.parse(texto) : null; } catch { return null; }
};

// Tema programado vigente (rango de fechas inclusive) o el tema fijo
export const temaEfectivo = (tema, programado, ahora = new Date()) => {
    if (programado && TEMAS.includes(programado.tema) && programado.desde && programado.hasta) {
        const desde = new Date(`${programado.desde}T00:00:00`);
        const hasta = new Date(`${programado.hasta}T23:59:59`);
        if (ahora >= desde && ahora <= hasta) return programado.tema;
    }
    return TEMAS.includes(tema) ? tema : "default";
};

export const leerConfig = async () => {
    const result = await executeRequest({ query: `SELECT clave, valor FROM web_config` });
    const config = Object.fromEntries(result.recordset.map(r => [r.clave, r.valor]));
    return {
        tema: config.tema || "default",
        temaProgramado: leerJson(config.tema_programado),
        ga4Id: config.ga4_id || null,
    };
};

const urlBanner = (archivo) => archivo ? `${BANNERS_URL}/${encodeURIComponent(archivo)}` : null;

const cargar = async () => {
    let config = { tema: "default", temaProgramado: null, ga4Id: null };
    let banners = [];
    try {
        config = await leerConfig();
        const tema = temaEfectivo(config.tema, config.temaProgramado);
        const result = await executeRequest({
            query: `SELECT idBanner, ubicacion, archivo, archivoMovil, alt, link, tema
                    FROM web_banner
                    WHERE activo = 1
                      AND (desde IS NULL OR desde <= SYSDATETIME())
                      AND (hasta IS NULL OR hasta >= SYSDATETIME())
                    ORDER BY ubicacion, orden, idBanner`
        });
        // Los banners de una temática sólo se muestran mientras esa temática está activa
        banners = result.recordset.filter(b => !b.tema || b.tema === tema);
    } catch (err) {
        console.error("No se pudo cargar la configuración web:", err.message);
    }

    const tema = temaEfectivo(config.tema, config.temaProgramado);
    const porUbicacion = {};
    for (const b of banners) {
        (porUbicacion[b.ubicacion] ??= []).push({
            id: b.idBanner,
            src: urlBanner(b.archivo),
            srcMovil: urlBanner(b.archivoMovil),
            alt: b.alt,
            link: b.link || null,
        });
    }

    cache = { fecha: Date.now(), data: { tema, ga4Id: config.ga4Id, banners: porUbicacion } };
};

export const getConfigPublica = async () => {
    if (!cache.data || Date.now() - cache.fecha > TTL_MS) {
        pendiente ??= cargar().finally(() => { pendiente = null; });
        await pendiente;
    }
    return cache.data;
};

export const invalidarConfig = () => { cache.fecha = 0; };
