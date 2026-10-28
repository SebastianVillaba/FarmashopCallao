import { executeRequest } from "../utils/dbHandler.js";
import { getImagenes, tieneImagen } from "../utils/imageIndex.js";
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

// Agrega slug e imágenes a cada producto
const mapProducto = (fila) => {
    const producto = limpiar(fila);
    const imagenes = getImagenes(producto.codigo);
    return {
        ...producto,
        slug: generarSlug(
            producto.nombreMercaderia || "Producto sin nombre", // Manejo de valores nulos
            producto.codigo || "0000" // Valor por defecto
        ),
        imagenes,
        imagen: imagenes[0] || null
    };
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
            respuesta: result.recordset.map(mapProducto)
        });
    } catch (err) {
        errorInterno(res, "getProducto", err);
    }
};

// Productos destacados para la home: con stock y con imagen.
// Se consultan todos los productos con stock (consulta liviana), se filtran los que
// tienen imagen y se cachea el resultado unos minutos.
const DESTACADOS_TTL_MS = 10 * 60 * 1000;
let cacheDestacados = { fecha: 0, data: [] };

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
            const conImagen = result.recordset.filter(p => tieneImagen(p.codigo));
            cacheDestacados = {
                fecha: Date.now(),
                data: (conImagen.length ? conImagen : result.recordset).map(mapProducto)
            };
        }

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: mezclar(cacheDestacados.data).slice(0, limit)
        });
    } catch (err) {
        errorInterno(res, "getDestacados", err);
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
            respuesta: result.recordset.map(mapProducto)
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
        if (!producto) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.status(200).json({
            mensaje: 'Consulta exitosa',
            respuesta: mapProducto(producto)
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
        if (!productos.has(fila.idProducto)) {
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
    getProducto,
    getDestacados,
    getCategorias,
    getMarcaByTipo,
    getProductoById,
    getProductoByNombre,
    getProductoByCategoria
}
