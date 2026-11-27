import { executeRequest } from "../utils/dbHandler.js";
import { getImagenes, tieneImagen } from "../utils/imageIndex.js";
import { asegurarOfertas, getIdsEnOferta } from "../utils/ofertas.js";
import { asegurarWebProductos, esVisible, getIdsConPrecioReferencia, getIdsDestacados, getWebProducto, precioWeb } from "../utils/webProductos.js";
import sql from 'mssql';

// Función para crear slug (sin acentos para URLs limpias)
const generarSlug = (nombre, codigo) => {
    return String(nombre)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // Quitar acentos
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
        .trim()
        .replace(/\s+/g, '-') // Espacios por guiones
        .replace(/-+/g, '-') // Evitar múltiples guiones
        + `-p${codigo}`;
};

// Las columnas CHAR del ERP vienen con espacios de relleno
const limpiar = (fila) => Object.fromEntries(
    Object.entries(fila).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
);

// Agrega slug, imágenes y el precio web (precio Farmashop / recomendado / oferta del ERP)
const mapProducto = (fila) => {
    const producto = limpiar(fila);
    const imagenes = getImagenes(producto.codigo);
    const { precio, precioAnterior, esPrecioFarmashop } = precioWeb(producto.idProducto, producto.precio);
    return {
        ...producto,
        slug: generarSlug(
            producto.nombreMercaderia || "Producto sin nombre", // Manejo de valores nulos
            producto.codigo || "0000" // Valor por defecto
        ),
        imagenes,
        imagen: imagenes[0] || null,
        precio,
        precioAnterior,
        precioFarmashop: esPrecioFarmashop
    };
};

// Quita los productos ocultos desde el panel y mapea el resto
const mapLista = (filas) => filas.filter(f => esVisible(f.idProducto)).map(mapProducto);

// Asegura que los cachés de ofertas y datos web estén cargados antes de responder
export const cargarCaches = async (req, res, next) => {
    await Promise.all([asegurarOfertas(), asegurarWebProductos()]);
    next();
};

// Productos por id (favoritos de la cuenta). Respeta el orden recibido y omite los ocultos.
// LEFT JOIN: un favorito sin filas de stock se muestra igual, como "Sin stock".
export const productosPorIds = async (ids) => {
    if (!ids.length) return [];
    await Promise.all([asegurarOfertas(), asegurarWebProductos()]);
    const inputs = ids.map((id, i) => ({ name: `id${i}`, type: sql.Int, value: id }));
    const result = await executeRequest({
        query: `SELECT
                    p.idProducto,
                    p.nombreProducto AS nombreMercaderia,
                    ISNULL(SUM(s.cantidad), 0) AS stockTotal,
                    p.codigo,
                    lb.nombre AS nombreLab,
                    p.precio
                FROM producto p
                LEFT JOIN stock s ON s.idProducto = p.idProducto
                LEFT JOIN v_laboratorio lb ON lb.idLaboratorio = p.idLaboratorio
                WHERE p.idProducto IN (${inputs.map(i => '@' + i.name).join(', ')})
                GROUP BY p.idProducto, p.nombreProducto, p.codigo, lb.nombre, p.precio`,
        inputs
    });
    const porId = new Map(mapLista(result.recordset).map(p => [p.idProducto, p]));
    return ids.map(id => porId.get(id)).filter(Boolean);
};

const errorInterno = (res, nombre, err) => {
    console.error(`Error en ${nombre}:`, err);
    res.status(500).json({
        error: "Error al consultar data",
        mensaje: err.message,
    });
};

const getProducto = async (req, res) => {
    try {
        const result = await executeRequest({
            query: `SELECT TOP 20
                        p.idProducto,
                        p.nombreProducto AS nombreMercaderia,
                        p.codigo,
                        lb.nombre as nombreLab,
                        p.precio
                    FROM
                        stock s
                    INNER JOIN
                        producto p ON s.idProducto = p.idProducto
                    INNER JOIN
                        v_laboratorio lb ON p.idLaboratorio = lb.idLaboratorio`,
            isStoredProcedure: false
        });

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: mapLista(result.recordset)
        });
    } catch (err) {
        errorInterno(res, "getProducto", err);
    }
};

// Productos destacados para la home: con stock y con imagen.
// Se consultan todos los productos con stock (consulta liviana), se filtran los que
// tienen imagen y se cachea el resultado unos minutos.
const DESTACADOS_TTL_MS = 10 * 60 * 1000;
let cacheDestacados = { fecha: 0, todos: [], conImagen: new Set() };

const mezclar = (lista) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
};

const getDestacados = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 48);

        if (Date.now() - cacheDestacados.fecha > DESTACADOS_TTL_MS) {
            const result = await executeRequest({
                query: `SELECT
                            p.idProducto,
                            p.nombreProducto AS nombreMercaderia,
                            p.codigo,
                            lb.nombre AS nombreLab,
                            p.precio,
                            SUM(s.cantidad) AS stockTotal
                        FROM stock s
                        INNER JOIN producto p ON s.idProducto = p.idProducto
                        INNER JOIN v_laboratorio lb ON p.idLaboratorio = lb.idLaboratorio
                        WHERE p.precio > 0
                        GROUP BY p.idProducto, p.nombreProducto, p.codigo, lb.nombre, p.precio
                        HAVING SUM(s.cantidad) > 0`,
                isStoredProcedure: false
            });
            // Priorizar productos con foto; si la carpeta de imágenes no está disponible, mostrar igual con stock
            cacheDestacados = {
                fecha: Date.now(),
                todos: result.recordset,
                conImagen: new Set(result.recordset.filter(p => tieneImagen(p.codigo)).map(p => p.idProducto))
            };
        }

        // Las ofertas tienen su propia sección en la home, no se repiten acá
        const enOferta = new Set(getIdsEnOferta());
        const candidatos = cacheDestacados.todos.filter(p => !enOferta.has(p.idProducto) && esVisible(p.idProducto));

        // Primero los marcados como destacados en el panel (con stock), después al azar
        const marcados = new Set(getIdsDestacados());
        const elegidos = candidatos.filter(p => marcados.has(p.idProducto));
        const resto = candidatos.filter(p => !marcados.has(p.idProducto) && cacheDestacados.conImagen.has(p.idProducto));
        const relleno = resto.length ? resto : candidatos.filter(p => !marcados.has(p.idProducto));

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: [...mezclar(elegidos), ...mezclar(relleno)].slice(0, limit).map(mapProducto)
        });
    } catch (err) {
        errorInterno(res, "getDestacados", err);
    }
};

// Productos con oferta vigente en el ERP y con stock, de mayor a menor descuento
const getOfertas = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 24, 1), 100);

        if (!getIdsEnOferta().length) {
            return res.status(200).json({ mensaje: "Consulta exitosa", respuesta: [] });
        }

        const result = await executeRequest({
            query: `SELECT
                        p.idProducto,
                        p.nombreProducto AS nombreMercaderia,
                        p.codigo,
                        lb.nombre AS nombreLab,
                        p.precio,
                        SUM(s.cantidad) AS stockTotal
                    FROM stock s
                    INNER JOIN producto p ON s.idProducto = p.idProducto
                    INNER JOIN v_laboratorio lb ON p.idLaboratorio = lb.idLaboratorio
                    WHERE p.precio > 0
                      AND p.idProducto IN (
                          SELECT d.idProducto
                          FROM detOferta d
                          INNER JOIN cabOferta o ON o.idOferta = d.idOferta
                          WHERE o.activo = 1 AND GETDATE() BETWEEN o.desde AND o.hasta AND d.fraccion = 0
                      )
                    GROUP BY p.idProducto, p.nombreProducto, p.codigo, lb.nombre, p.precio
                    HAVING SUM(s.cantidad) > 0`,
            isStoredProcedure: false
        });

        const descuento = (p) => 1 - p.precio / p.precioAnterior;
        const productos = mapLista(result.recordset)
            .filter(p => p.precioAnterior)
            .sort((a, b) => (Boolean(b.imagen) - Boolean(a.imagen)) || (descuento(b) - descuento(a)));

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: productos.slice(0, limit)
        });
    } catch (err) {
        errorInterno(res, "getOfertas", err);
    }
};

// ---------------------------------------------------------------- Productos por % de descuento
// Rangos de los botones de la home (porcentaje redondeado, igual que la etiqueta de la tarjeta)
export const RANGOS_DESCUENTO = {
    '20': { min: 20, max: 29 },
    '30': { min: 30, max: 39 },
    '40': { min: 40, max: 49 },
    '50': { min: 50, max: 50 },
    '50mas': { min: 51, max: 100 },
};
const DESCUENTOS_TTL_MS = 5 * 60 * 1000;
let cacheDescuentos = { fecha: 0, productos: [] };

export const porcentajeDescuento = (p) =>
    p.precioAnterior > p.precio && p.precio > 0 ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;

// Todos los productos con descuento vigente y stock (ofertas del ERP + precios recomendados/Farmashop)
const productosConDescuento = async () => {
    if (Date.now() - cacheDescuentos.fecha < DESCUENTOS_TTL_MS) return cacheDescuentos.productos;
    const ids = [...new Set([...getIdsEnOferta(), ...getIdsConPrecioReferencia()])];
    const productos = [];
    // SQL Server admite hasta 2100 parámetros por consulta
    for (let i = 0; i < ids.length; i += 1000) {
        productos.push(...await productosPorIds(ids.slice(i, i + 1000)));
    }
    const conDescuento = productos
        .filter(p => p.stockTotal > 0 && porcentajeDescuento(p) >= RANGOS_DESCUENTO['20'].min)
        .map(p => ({ ...p, descuento: porcentajeDescuento(p) }))
        .sort((a, b) => (Boolean(b.imagen) - Boolean(a.imagen)) || (b.descuento - a.descuento));
    cacheDescuentos = { fecha: Date.now(), productos: conDescuento };
    return conDescuento;
};

const enRango = (p, { min, max }) => p.descuento >= min && p.descuento <= max;

// Cantidad de productos por rango (la home oculta los botones vacíos)
const getResumenDescuentos = async (req, res) => {
    try {
        const productos = await productosConDescuento();
        const respuesta = Object.fromEntries(Object.entries(RANGOS_DESCUENTO).map(([k, r]) => [k, productos.filter(p => enRango(p, r)).length]));
        res.status(200).json({ mensaje: "Consulta exitosa", respuesta });
    } catch (err) {
        errorInterno(res, "getResumenDescuentos", err);
    }
};

const getProductosPorDescuento = async (req, res) => {
    try {
        const rango = RANGOS_DESCUENTO[req.query.rango];
        if (!rango) return res.status(400).json({ error: "Rango de descuento inválido" });
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), 300);
        const productos = (await productosConDescuento()).filter(p => enRango(p, rango));
        res.status(200).json({ mensaje: "Consulta exitosa", respuesta: productos.slice(0, limit), total: productos.length });
    } catch (err) {
        errorInterno(res, "getProductosPorDescuento", err);
    }
};

const getProductoByNombre = async (req, res) => {
    try {
        const { palabra } = req.query;

        if (!palabra || !String(palabra).trim()) {
            return res.status(200).json({ mensaje: "Consulta exitosa", respuesta: [] });
        }

        const result = await executeRequest({
            query: `sp_webConsultaProducto`,
            isStoredProcedure: true,
            inputs: [
                {
                    name: 'parametro',
                    type: sql.VarChar(255),
                    value: String(palabra).trim()
                }
            ]
        });

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: mapLista(result.recordset)
        });
    } catch (err) {
        errorInterno(res, "getProductoByNombre", err);
    }
};

export const getProductoById = async (req, res) => {
    try {
        const id = /^\d+$/.test(String(req.query.id)) ? parseInt(req.query.id) : NaN;
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "ID de producto inválido" });
        }

        const result = await executeRequest({
            query: `SELECT
                        p.idProducto,
                        p.nombreProducto AS nombreMercaderia,
                        SUM(s.cantidad) AS stockTotal,
                        p.codigo,
                        lb.nombre as nombreLab,
                        p.precio
                    FROM
                        stock s
                    INNER JOIN
                        producto p ON s.idProducto = p.idProducto
                    INNER JOIN
                        v_laboratorio lb on p.idLaboratorio = lb.idLaboratorio
                    WHERE
                        s.idProducto = @id
                    GROUP BY
                        p.idProducto, p.nombreProducto, p.codigo, lb.nombre, p.precio;`,
            isStoredProcedure: false,
            inputs: [{ name: 'id', type: sql.Int, value: id }]
        });

        const producto = result.recordset[0];
        if (!producto || !esVisible(producto.idProducto)) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.status(200).json({
            mensaje: 'Consulta exitosa',
            respuesta: { ...mapProducto(producto), descripcionWeb: getWebProducto(producto.idProducto)?.descripcionWeb || null }
        });
    } catch (err) {
        errorInterno(res, "getProductoById", err);
    }
};

const getCategorias = async (req, res) => {
    try {
        const result = await executeRequest({
            query: `sp_webConsultaCategoriaProducto`,
            isStoredProcedure: true,
            inputs: [
                {
                    name: 'idConfig',
                    type: sql.Int,
                    value: 1
                }
            ]
        });
        res.status(200).json({
            mensaje: 'Consulta exitosa',
            respuesta: result.recordset
        });
    } catch (err) {
        errorInterno(res, "getCategorias", err);
    }
};

// Acepta una o varias categorías separadas por coma (ej: idCategoria=12,15,40)
const MAX_CATEGORIAS = 25;

const getProductoByCategoria = async (req, res) => {
  try {
    const ids = [...new Set(
      String(req.query.idCategoria || '')
        .split(',')
        .map(v => v.trim())
        .filter(v => /^\d+$/.test(v))
        .map(Number)
    )].slice(0, MAX_CATEGORIAS);
    
    if (!ids.length) {
      return res.status(400).json({
        error: "ID de categoría requerido"
      });
    }

    const resultados = await Promise.all(ids.map(idTipoProducto => executeRequest({
      query: `sp_webConsultaProductoCategoria`,
      isStoredProcedure: true,
      inputs: [
        { 
          name: 'idTipoProducto', 
          type: sql.Int,
          value: idTipoProducto
        }
      ]
    })));

    // Unir resultados sin duplicar productos
    const productos = new Map();
    resultados.forEach((result, i) => {
      for (const fila of result.recordset || []) {
        if (!productos.has(fila.idProducto) && esVisible(fila.idProducto)) {
          productos.set(fila.idProducto, { ...mapProducto(fila), idTipoProducto: ids[i] });
        }
      }
    });

    res.status(200).json({
      mensaje: "Consulta exitosa",
      respuesta: [...productos.values()]
    });
  } catch (err) {
    errorInterno(res, "getProductoByCategoria", err);
  }
};

const getMarcaByTipo = async (req, res) => {
    try {
        const tipoProducto = parseInt(req.query.tipoProducto);
        if (!Number.isInteger(tipoProducto)) {
            return res.status(400).json({ error: "Tipo de producto inválido" });
        }

        const result = await executeRequest({
            query: `SELECT idMarca, nombreMarca FROM funMarcaTipo_tabla (@tipoProducto)`,
            inputs: [{ name: 'tipoProducto', type: sql.Int, value: tipoProducto }]
        });

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: result.recordset.map(limpiar),
        });
    } catch (err) {
        errorInterno(res, "getMarcaByTipo", err);
    }
}

export default {
    getResumenDescuentos,
    getProductosPorDescuento,
    getProducto,
    getDestacados,
    getOfertas,
    getCategorias,
    getMarcaByTipo,
    getProductoById,
    getProductoByNombre,
    getProductoByCategoria
}
