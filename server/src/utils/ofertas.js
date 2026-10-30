// ofertas.js
// Caché en memoria de las ofertas vigentes del ERP (cabOferta + detOferta).
// Mientras una oferta está activa el ERP pone producto.precio = precioOferta y guarda
// precioAnterior para restaurarlo, así que acá sólo se necesita el precio anterior (para tacharlo).
import { executeRequest } from "./dbHandler.js";

const REFRESCO_MS = 5 * 60 * 1000;

let ofertas = new Map(); // idProducto -> precioAnterior
let fecha = 0;
let pendiente = null;

const cargarOfertas = async () => {
    try {
        const result = await executeRequest({
            query: `SELECT d.idProducto, MAX(d.precioAnterior) AS precioAnterior
                    FROM detOferta d
                    INNER JOIN cabOferta o ON o.idOferta = d.idOferta
                    WHERE o.activo = 1
                      AND GETDATE() BETWEEN o.desde AND o.hasta
                      AND d.fraccion = 0
                      AND d.precioAnterior > 0
                    GROUP BY d.idProducto`,
            isStoredProcedure: false
        });
        ofertas = new Map(result.recordset.map(o => [o.idProducto, Number(o.precioAnterior)]));
        fecha = Date.now();
    } catch (err) {
        console.error("No se pudieron cargar las ofertas:", err.message);
    }
};

// Recarga las ofertas si el caché venció (evita consultas duplicadas en paralelo)
export const asegurarOfertas = async () => {
    if (Date.now() - fecha < REFRESCO_MS) return;
    pendiente ??= cargarOfertas().finally(() => { pendiente = null; });
    await pendiente;
};

export const getIdsEnOferta = () => [...ofertas.keys()];

// Precio anterior sólo si el ERP ya aplicó el precio de oferta (precio actual menor)
export const getPrecioAnterior = (idProducto, precio) => {
    const anterior = ofertas.get(idProducto);
    return anterior && Number(precio) < anterior ? anterior : null;
};

export const iniciarOfertas = async () => {
    await cargarOfertas();
    setInterval(cargarOfertas, REFRESCO_MS).unref();
};
