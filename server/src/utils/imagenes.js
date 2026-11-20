// imagenes.js
// Subida y procesamiento de imágenes desde el panel (productos y banners).
// Todas se normalizan a WebP con sharp; los nombres de archivo los genera el servidor.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import sharp from "sharp";
import dotenv from "dotenv";
import { IMAGES_DIR, getArchivosImagen, marcarVersionImagenes, refrescarIndiceImagenes } from "./imageIndex.js";

dotenv.config();

// En Windows la caché de sharp mantiene archivos abiertos e impide borrarlos/renombrarlos
sharp.cache(false);

export const BANNERS_DIR = process.env.BANNERS_DIR || path.resolve(IMAGES_DIR, "..", "banners");

export const asegurarCarpetaBanners = async () => {
    try {
        await fs.promises.mkdir(BANNERS_DIR, { recursive: true });
    } catch (err) {
        console.error(`No se pudo crear la carpeta de banners (${BANNERS_DIR}):`, err.message);
    }
};

// Las imágenes quedan en memoria sólo mientras se procesan
export const subida = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024, files: 10 },
    fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

export class ImagenInvalida extends Error {
    constructor() {
        super("El archivo no es una imagen válida");
        this.status = 400;
    }
}

// Valida el contenido real (no la extensión) y convierte a WebP
const aWebp = async (buffer, { ancho, alto, fondoBlanco = false, calidad = 85 }) => {
    try {
        const meta = await sharp(buffer).metadata();
        if (!meta.width || !meta.height) throw new ImagenInvalida();
    } catch {
        throw new ImagenInvalida();
    }
    let img = sharp(buffer).rotate().resize(ancho, alto, { fit: "inside", withoutEnlargement: true });
    if (fondoBlanco) img = img.flatten({ background: "#ffffff" });
    return img.webp({ quality: calidad }).toBuffer();
};

// ---------------- Productos ----------------
// Convención: {codigo}.webp principal, {codigo}_1.webp, {codigo}_2.webp... adicionales

const codigoSeguro = (codigo) => {
    const limpio = String(codigo || "").trim();
    if (!/^[\w.-]+$/.test(limpio)) {
        const err = new Error("El código del producto no se puede usar como nombre de archivo");
        err.status = 400;
        throw err;
    }
    return limpio;
};

const nombreImagen = (codigo, orden) => orden === 0 ? `${codigo}.webp` : `${codigo}_${orden}.webp`;
const rutaProducto = (archivo) => path.join(IMAGES_DIR, path.basename(archivo));

// Agrega una imagen al final de la galería del producto (o como principal si no tiene)
export const guardarImagenProducto = async (codigo, buffer) => {
    const cod = codigoSeguro(codigo);
    const webp = await aWebp(buffer, { ancho: 1200, alto: 1200, fondoBlanco: true });

    await refrescarIndiceImagenes();
    const existentes = new Set(getArchivosImagen(cod).map(a => a.toLowerCase()));
    let orden = 0;
    while (existentes.has(nombreImagen(cod, orden).toLowerCase())) orden++;

    await fs.promises.writeFile(rutaProducto(nombreImagen(cod, orden)), webp);
    marcarVersionImagenes(cod);
    await refrescarIndiceImagenes();
    return getArchivosImagen(cod);
};

const validarArchivoDelProducto = (cod, archivo) => {
    const actuales = getArchivosImagen(cod);
    const encontrado = actuales.find(a => a.toLowerCase() === String(archivo).toLowerCase());
    if (!encontrado) {
        const err = new Error("La imagen no pertenece al producto");
        err.status = 404;
        throw err;
    }
    return { actuales, encontrado };
};

// Renombra en dos pasos (vía temporales) para no pisar archivos
const aplicarOrden = async (cod, archivosOrdenados) => {
    marcarVersionImagenes(cod);
    const temporales = [];
    for (const archivo of archivosOrdenados) {
        const tmp = `${cod}.__tmp_${crypto.randomUUID()}.webp`;
        await fs.promises.rename(rutaProducto(archivo), rutaProducto(tmp));
        temporales.push(tmp);
    }
    for (const [i, tmp] of temporales.entries()) {
        await fs.promises.rename(rutaProducto(tmp), rutaProducto(nombreImagen(cod, i)));
    }
};

export const eliminarImagenProducto = async (codigo, archivo) => {
    const cod = codigoSeguro(codigo);
    await refrescarIndiceImagenes();
    const { actuales, encontrado } = validarArchivoDelProducto(cod, archivo);
    await fs.promises.unlink(rutaProducto(encontrado));
    // Compacta la numeración para que siempre haya una principal
    await aplicarOrden(cod, actuales.filter(a => a !== encontrado));
    await refrescarIndiceImagenes();
    return getArchivosImagen(cod);
};

// Mueve una imagen a la posición principal
export const marcarPrincipal = async (codigo, archivo) => {
    const cod = codigoSeguro(codigo);
    await refrescarIndiceImagenes();
    const { actuales, encontrado } = validarArchivoDelProducto(cod, archivo);
    await aplicarOrden(cod, [encontrado, ...actuales.filter(a => a !== encontrado)]);
    await refrescarIndiceImagenes();
    return getArchivosImagen(cod);
};

// ---------------- Banners ----------------

export const guardarBanner = async (buffer, movil = false) => {
    const webp = await aWebp(buffer, movil ? { ancho: 1200, alto: 1200, calidad: 82 } : { ancho: 2400, alto: 1200, calidad: 82 });
    const archivo = `banner-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${movil ? "-m" : ""}.webp`;
    await fs.promises.writeFile(path.join(BANNERS_DIR, archivo), webp);
    return archivo;
};

export const eliminarArchivoBanner = async (archivo) => {
    if (!archivo) return;
    try {
        await fs.promises.unlink(path.join(BANNERS_DIR, path.basename(archivo)));
    } catch (err) {
        if (err.code !== "ENOENT") console.error("No se pudo borrar el banner:", err.message);
    }
};
