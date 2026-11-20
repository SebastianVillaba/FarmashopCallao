// webProductos.js
// Caché en memoria de los datos web cargados desde el panel (tabla web_producto):
// visibilidad, destacado, descripción y los precios recomendado / Farmashop.
import { executeRequest } from "./dbHandler.js";
import { getPrecioAnterior } from "./ofertas.js";

const REFRESCO_MS = 5 * 60 * 1000;

let datos = new Map(); // idProducto -> { visible, destacado, descripcionWeb, precioRecomendado, precioFarmashop }
let fecha = 0;
let pendiente = null;

const cargar = async () => {
    try {
        const result = await executeRequest({
            query: `SELECT idProducto, visible, destacado, descripcionWeb, precioRecomendado, precioFarmashop
                    FROM web_producto`
        });
        datos = new Map(result.recordset.map(r => [r.idProducto, {
            visible: Boolean(r.visible),
            destacado: Boolean(r.destacado),
            descripcionWeb: r.descripcionWeb || null,
            precioRecomendado: r.precioRecomendado != null ? Number(r.precioRecomendado) : null,
            precioFarmashop: r.precioFarmashop != null ? Number(r.precioFarmashop) : null,
        }]));
        fecha = Date.now();
    } catch (err) {
        // Si la tabla todavía no existe la web sigue funcionando con los datos del ERP
        console.error("No se pudieron cargar los datos web de productos:", err.message);
        fecha = Date.now();
    }
};

export const asegurarWebProductos = async () => {
    if (Date.now() - fecha < REFRESCO_MS) return;
    pendiente ??= cargar().finally(() => { pendiente = null; });
    await pendiente;
};

// Fuerza la recarga (se llama al guardar desde el panel)
export const refrescarWebProductos = async () => {
    fecha = 0;
    await asegurarWebProductos();
};

export const iniciarWebProductos = async () => {
    await cargar();
    setInterval(cargar, REFRESCO_MS).unref();
};

export const getWebProducto = (idProducto) => datos.get(idProducto) || null;

export const esVisible = (idProducto) => datos.get(idProducto)?.visible !== false;

export const getIdsDestacados = () =>
    [...datos].filter(([, d]) => d.destacado && d.visible).map(([id]) => id);

// Precio que se muestra y se cobra en la web.
// - Si hay precio Farmashop se usa ése (salvo que una oferta vigente del ERP lo deje aún más bajo).
// - El precio tachado es el recomendado; si no hay, el precio anterior de la oferta del ERP.
export const precioWeb = (idProducto, precioErp) => {
    const erp = Number(precioErp) || 0;
    const web = datos.get(idProducto);
    const ofertaErp = getPrecioAnterior(idProducto, erp); // precio anterior si hay oferta vigente

    let precio = erp;
    let esPrecioFarmashop = false;
    if (web?.precioFarmashop > 0 && !(ofertaErp && erp > 0 && erp < web.precioFarmashop)) {
        precio = web.precioFarmashop;
        esPrecioFarmashop = true;
    }

    const referencia = web?.precioRecomendado || ofertaErp || (esPrecioFarmashop ? erp : null);
    return {
        precio,
        precioAnterior: referencia && referencia > precio ? referencia : null,
        esPrecioFarmashop,
    };
};
