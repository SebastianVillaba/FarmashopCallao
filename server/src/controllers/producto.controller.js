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
                        m.nombreMarca,
                        p.precio
                    FROM 
                        stock s
                    INNER JOIN 
                        producto p ON s.idProducto = p.idProducto
                    INNER JOIN
                        marca m ON p.idMarca = m.idMarca`,
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

export const getProductoById = async (req, res) => {
    try {
        const { id } = req.query;
        const result = await executeRequest({
            query: `SELECT 
                        p.idProducto,
                        p.nombreProducto AS nombreMercaderia,
                        SUM(s.cantidad) AS stockTotal,
                        p.codigo,
                        m.nombreMarca,
                        p.precio
                    FROM 
                        stock s
                    INNER JOIN 
                        producto p ON s.idProducto = p.idProducto
                    INNER JOIN
                        marca m ON p.idMarca = m.idMarca
                    WHERE 
                        s.idProducto = ${id}
                    GROUP BY 
                        p.idProducto, p.nombreProducto, p.codigo, m.nombreMarca, p.precio;`,
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

const getTipoProducto = async (req, res) => {
    try {
        const result = await executeRequest({
            query: 'SELECT * FROM v_tipoProducto',
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

const getMarcaByTipo = async (req, res) => {
    try {
        const { tipoProducto } = req.query

        const result = await executeRequest({
            query: `SELEC   T idMarca, nombreMarca FROM funMarcaTipo_tabla (${tipoProducto})`
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
    getTipoProducto,
    getMarcaByTipo,
    getProductoById
}