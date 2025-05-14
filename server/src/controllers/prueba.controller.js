import { executeRequest } from "../utils/dbHandler.js";


export const probarSql = async (req, res) => {
    try {
        const { id } = req.query;
        const result = await executeRequest({
            query: `SELECT 
                        p.idProducto,
                        p.nombreProducto,
                        SUM(s.cantidad) AS stockTotal,
                        p.codigo,
                        m.nombreMarca
                    FROM 
                        stock s
                    INNER JOIN 
                        producto p ON s.idProducto = p.idProducto
                    INNER JOIN
                        marca m ON p.idMarca = m.idMarca
                    WHERE 
                        s.idProducto = ${id}
                    GROUP BY 
                        p.idProducto, p.nombreProducto, p.codigo, m.nombreMarca;`,
            isStoredProcedure: false
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