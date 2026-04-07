import { executeRequest } from "../utils/dbHandler.js";
import sql from 'mssql';

// Función para crear slug
const generarSlug = (nombre, codigo) => {
    return nombre
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúüñ\s-]/g, '') // Eliminar caracteres especiales
        .replace(/\s+/g, '-') // Espacios por guiones
        .replace(/-+/g, '-') // Evitar múltiples guiones
        .trim()
        + `-p${codigo}`;
};

const getProducto = async (req, res) => {
    try {
        const { palabra } = req.query;
        
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

        // 1. Verifica la estructura de los datos
        //console.log("Datos recibidos del SP:", result.recordset); 

        // 2. Genera slugs para cada producto
        const productosConSlug = result.recordset.map(producto => ({
            ...producto,
            slug: generarSlug(
                producto.nombreMercaderia || "Producto sin nombre", // Manejo de valores nulos
                producto.codigo || "0000" // Valor por defecto
            )
        }));

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: productosConSlug // Envía el array completo
        });

    } catch (err) {
        console.error("Error en getProducto:", err);
        res.status(500).json({
            error: "Error al consultar data",
            mensaje: err.message,
        });
    }
};

const getProductoByNombre = async (req, res) => {
    try {
        const { palabra } = req.query;
        
        const result = await executeRequest({
            query: `sp_webConsultaProducto`,
            isStoredProcedure: true,
            inputs: [
                { 
                    name: 'parametro', 
                    type: sql.VarChar(255),  // Asegúrate de importar 'sql' de mssql
                    value: palabra 
                }
            ]
        });

        // 2. Genera slugs para cada producto
        const productosConSlug = result.recordset.map(producto => ({
            ...producto,
            slug: generarSlug(
                producto.nombreMercaderia || "Producto sin nombre", // Manejo de valores nulos
                producto.codigo || "0000" // Valor por defecto
            )
        }));

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: productosConSlug // Envía el array completo
        });

    } catch (err) {
        console.error("Error en getProducto:", err);
        res.status(500).json({
            error: "Error al consultar data",
            mensaje: err.message,
        });
    }
};

export const getProductoById = async (req, res) => {
    try {
        const { id } = req.query;
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
                        s.idProducto = ${id}
                    GROUP BY 
                        p.idProducto, p.nombreProducto, p.codigo, lb.nombre, p.precio;`,
            isStoredProcedure: false
        });

        // Generar slug dinámicamente
        const producto = result.recordset[0];
        const slug = generarSlug(producto.nombreMercaderia, producto.codigo);
        
        res.status(200).json({
            mensaje: 'Consulta exitosa',
            respuesta: { ...producto, slug } // Incluir slug en la respuesta
        });        
    } catch (error) {
        console.log("Error en getProductoById: ", error);
        res.status(500).json({ error: "Error al consultar data", mensaje: error.message });
    };
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
    } catch (error) {
        console.log("Error en getListado: ", error);
        res.status(500).json({
            error: "Error al consultar data",
            mensaje: error.message,
        });
        
    };

};

const getProductoByCategoria = async (req, res) => {
  try {
    const { idCategoria } = req.query;
    
    if (!idCategoria) {
      return res.status(400).json({
        error: "ID de categoría requerido"
      });
    }

    const result = await executeRequest({
      query: `sp_webConsultaProductoCategoria`,
      isStoredProcedure: true,
      inputs: [
        { 
          name: 'idTipoProducto', 
          type: sql.Int,
          value: parseInt(idCategoria) 
        }
      ]
    });

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontraron productos para esta categoría",
        respuesta: []
      });
    }

    const productosConSlug = result.recordset.map(producto => ({
      ...producto,
      slug: generarSlug(
        producto.nombreMercaderia || "Producto sin nombre",
        producto.codigo || "0000"
      )
    }));

    res.status(200).json({
      mensaje: "Consulta exitosa",
      respuesta: productosConSlug
    });

  } catch (err) {
    console.error("Error en getProductoByCategoria:", err);
    res.status(500).json({
      error: "Error al consultar productos por categoría",
      mensaje: err.message,
    });
  }
};

const getMarcaByTipo = async (req, res) => {
    try {
        const { tipoProducto } = req.query

        const result = await executeRequest({
            query: `SELECT idMarca, nombreMarca FROM funMarcaTipo_tabla (${tipoProducto})`
        });

        if (result.recordset.length < 0) {
            res.status(404).json({
                mensaje: "NO ENCONTRADO EN LA BASE DE DATOS"
            });
        }

        res.status(200).json({
            mensaje: "Consulta exitosa",
            respuesta: result.recordset,
        });
    
    } catch (err) {
        console.error("Error en getProducto:", err);
        res.status(500).json({
            error: "Error al consultar data",
            mensaje: err.message,
        });
    }
}

export default {
    getProducto,
    getCategorias,
    getMarcaByTipo,
    getProductoById,
    getProductoByNombre,
    getProductoByCategoria
}