import { executeRequest } from "../utils/dbHandler.js";


export const probarSql = async (req, res) => {
    try {
        const { id } = req.query;
        const result = await executeRequest({
            query: `SELECT * FROM v_producto WHERE idTipoProducto = 2`,
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