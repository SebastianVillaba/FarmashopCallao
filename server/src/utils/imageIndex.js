// imageIndex.js
// Índice en memoria de las imágenes de productos.
// Convención de archivos: {codigo}.webp es la principal, {codigo}_1.webp, {codigo}_2.webp... son adicionales.
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

export const IMAGES_DIR = process.env.IMAGES_DIR || "C:\\FarmaShop\\Imagenes\\webp";
export const IMAGES_URL = "/imagenes";

const PATRON = /^(.+?)(?:_(\d+))?\.webp$/i;
const REFRESCO_MS = 10 * 60 * 1000;

let indice = new Map();

const construirIndice = async () => {
  try {
    const archivos = await fs.promises.readdir(IMAGES_DIR);
    const nuevo = new Map();

    for (const archivo of archivos) {
      const match = archivo.match(PATRON);
      if (!match) continue;
      const codigo = match[1].toLowerCase();
      const orden = match[2] === undefined ? -1 : parseInt(match[2]);
      if (!nuevo.has(codigo)) nuevo.set(codigo, []);
      nuevo.get(codigo).push({ archivo, orden });
    }

    for (const [codigo, lista] of nuevo) {
      nuevo.set(
        codigo,
        lista
          .sort((a, b) => a.orden - b.orden)
          .map(({ archivo }) => `${IMAGES_URL}/${encodeURIComponent(archivo)}`)
      );
    }

    indice = nuevo;
    console.log(`Índice de imágenes: ${indice.size} productos`);
  } catch (err) {
    console.error(`No se pudo leer la carpeta de imágenes (${IMAGES_DIR}):`, err.message);
  }
};

export const iniciarIndiceImagenes = async () => {
  await construirIndice();

  // fs.watch en Windows puede perder eventos, por eso también se reconstruye periódicamente
  let timer;
  try {
    fs.watch(IMAGES_DIR, () => {
      clearTimeout(timer);
      timer = setTimeout(construirIndice, 2000);
    });
  } catch (err) {
    console.error("No se pudo vigilar la carpeta de imágenes:", err.message);
  }
  setInterval(construirIndice, REFRESCO_MS).unref();
};

// Versión de las imágenes modificadas desde el panel: evita que el navegador muestre la foto vieja
// (las imágenes se cachean 7 días y al reordenar se reutilizan los mismos nombres de archivo)
const versiones = new Map();
export const marcarVersionImagenes = (codigo) => versiones.set(String(codigo).trim().toLowerCase(), Date.now());

const urlsSinVersion = (codigo) => {
  if (codigo === null || codigo === undefined) return [];
  return indice.get(String(codigo).trim().toLowerCase()) || [];
};

export const getImagenes = (codigo) => {
  const urls = urlsSinVersion(codigo);
  const version = urls.length ? versiones.get(String(codigo).trim().toLowerCase()) : null;
  return version ? urls.map(u => `${u}?v=${version}`) : urls;
};

// Reconstruye el índice al instante (después de subir o borrar fotos desde el panel)
export const refrescarIndiceImagenes = construirIndice;

// Nombres de archivo (no URLs) de las imágenes de un producto, en orden
export const getArchivosImagen = (codigo) =>
    urlsSinVersion(codigo).map(url => decodeURIComponent(url.slice(IMAGES_URL.length + 1)));

export const tieneImagen = (codigo) => getImagenes(codigo).length > 0;
