// Panel: estadísticas de la web (ventas, visitas, conversión, fuentes y reportes de apoyo).
// Un solo endpoint devuelve todo el tablero para el rango pedido.
import sql from "mssql";
import { executeRequest } from "../../utils/dbHandler.js";
import { tieneImagen } from "../../utils/imageIndex.js";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DIAS = 366;

const hoy = () => new Date().toISOString().slice(0, 10);
const sumarDias = (iso, dias) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + dias);
    return d.toISOString().slice(0, 10);
};
const diasEntre = (a, b) => Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000);

// Rango [desde, hasta] inclusive y el período anterior de igual duración
const rango = (query) => {
    let hasta = FECHA.test(query.hasta) ? query.hasta : hoy();
    let desde = FECHA.test(query.desde) ? query.desde : sumarDias(hasta, -29);
    if (desde > hasta) [desde, hasta] = [hasta, desde];
    if (diasEntre(desde, hasta) > MAX_DIAS) desde = sumarDias(hasta, -MAX_DIAS);
    const dias = diasEntre(desde, hasta) + 1;
    return { desde, hasta, dias, anteriorDesde: sumarDias(desde, -dias), anteriorHasta: sumarDias(desde, -1) };
};

// Ejecuta una consulta con @desde / @hasta (fechas inclusive, se comparan como [desde, hasta+1))
const consulta = (query, desde, hasta) => executeRequest({
    query: `DECLARE @d DATETIME2 = CONVERT(DATE, @desde), @h DATETIME2 = DATEADD(DAY, 1, CONVERT(DATE, @hasta));
            ${query}`,
    inputs: [
        { name: "desde", type: sql.VarChar(10), value: desde },
        { name: "hasta", type: sql.VarChar(10), value: hasta },
    ]
}).then(r => r.recordset);

const NO_CANCELADO = "p.estado <> 'cancelado'";

const resumenPeriodo = async (desde, hasta) => {
    const [ventas] = await consulta(`
        SELECT COUNT(*) AS pedidos,
               ISNULL(SUM(p.total), 0) AS ventas,
               SUM(CASE WHEN p.estado = 'entregado' THEN 1 ELSE 0 END) AS finalizados,
               ISNULL(SUM(CASE WHEN p.estado = 'entregado' THEN p.total END), 0) AS ventasFinalizadas,
               SUM(p.esNuevo) AS clientesNuevos,
               COUNT(DISTINCT p.email) AS clientes
        FROM (
            SELECT p.*, CASE WHEN EXISTS (SELECT 1 FROM web_pedido x WHERE x.email = p.email AND x.fecha < p.fecha AND x.estado <> 'cancelado')
                             THEN 0 ELSE 1 END AS esNuevo
            FROM web_pedido p
            WHERE p.fecha >= @d AND p.fecha < @h AND ${NO_CANCELADO}
        ) p`, desde, hasta);
    const [trafico] = await consulta(`
        SELECT COUNT(*) AS sesiones, COUNT(DISTINCT s.visitanteId) AS visitantes,
               SUM(CASE WHEN p.idPedido IS NOT NULL AND p.estado <> 'cancelado' THEN 1 ELSE 0 END) AS sesionesConCompra,
               SUM(CASE WHEN p.estado = 'entregado' THEN 1 ELSE 0 END) AS sesionesFinalizadas
        FROM web_sesion s
        LEFT JOIN web_pedido p ON p.idPedido = s.idPedido
        WHERE s.inicio >= @d AND s.inicio < @h`, desde, hasta);

    const pedidos = Number(ventas.pedidos) || 0;
    const sesiones = Number(trafico.sesiones) || 0;
    return {
        pedidos,
        ventas: Number(ventas.ventas) || 0,
        finalizados: Number(ventas.finalizados) || 0,
        ventasFinalizadas: Number(ventas.ventasFinalizadas) || 0,
        ticketPromedio: pedidos ? Math.round(Number(ventas.ventas) / pedidos) : 0,
        clientes: Number(ventas.clientes) || 0,
        clientesNuevos: Number(ventas.clientesNuevos) || 0,
        sesiones,
        visitantes: Number(trafico.visitantes) || 0,
        // Visitas que terminaron en compra / visitas (pedidos atribuidos a una sesión)
        conversion: sesiones ? (Number(trafico.sesionesConCompra) || 0) / sesiones : 0,
        conversionFinalizada: sesiones ? (Number(trafico.sesionesFinalizadas) || 0) / sesiones : 0,
    };
};

const serieDiaria = async (desde, hasta) => {
    const [ventas, sesiones] = await Promise.all([
        consulta(`SELECT CONVERT(VARCHAR(10), p.fecha, 23) AS dia, COUNT(*) AS pedidos, SUM(p.total) AS ventas
                  FROM web_pedido p WHERE p.fecha >= @d AND p.fecha < @h AND ${NO_CANCELADO}
                  GROUP BY CONVERT(VARCHAR(10), p.fecha, 23)`, desde, hasta),
        consulta(`SELECT CONVERT(VARCHAR(10), inicio, 23) AS dia, COUNT(*) AS sesiones
                  FROM web_sesion WHERE inicio >= @d AND inicio < @h
                  GROUP BY CONVERT(VARCHAR(10), inicio, 23)`, desde, hasta),
    ]);
    const v = new Map(ventas.map(r => [r.dia, r]));
    const s = new Map(sesiones.map(r => [r.dia, r]));
    const serie = [];
    for (let dia = desde; dia <= hasta; dia = sumarDias(dia, 1)) {
        serie.push({
            dia,
            ventas: Number(v.get(dia)?.ventas) || 0,
            pedidos: Number(v.get(dia)?.pedidos) || 0,
            sesiones: Number(s.get(dia)?.sesiones) || 0,
        });
    }
    return serie;
};

const embudo = async (desde, hasta) => {
    const [r] = await consulta(`
        SELECT COUNT(*) AS sesiones,
               SUM(f.vio) AS vieronProducto,
               SUM(f.carrito) AS agregaronCarrito,
               SUM(f.checkout) AS iniciaronCheckout,
               SUM(CASE WHEN s.idPedido IS NOT NULL THEN 1 ELSE 0 END) AS compraron
        FROM web_sesion s
        OUTER APPLY (
            SELECT MAX(CASE WHEN e.tipo = 'view_item' THEN 1 ELSE 0 END) AS vio,
                   MAX(CASE WHEN e.tipo = 'add_to_cart' THEN 1 ELSE 0 END) AS carrito,
                   MAX(CASE WHEN e.tipo = 'begin_checkout' THEN 1 ELSE 0 END) AS checkout
            FROM web_evento e WHERE e.idSesion = s.idSesion
        ) f
        WHERE s.inicio >= @d AND s.inicio < @h`, desde, hasta);
    return [
        { paso: "Visitas", valor: Number(r.sesiones) || 0 },
        { paso: "Vieron un producto", valor: Number(r.vieronProducto) || 0 },
        { paso: "Agregaron al carrito", valor: Number(r.agregaronCarrito) || 0 },
        { paso: "Iniciaron el checkout", valor: Number(r.iniciaronCheckout) || 0 },
        { paso: "Compraron", valor: Number(r.compraron) || 0 },
    ];
};

const fuentes = (desde, hasta) => consulta(`
    SELECT s.fuente, ISNULL(s.medio, '') AS medio,
           COUNT(*) AS sesiones,
           COUNT(p.idPedido) AS pedidos,
           ISNULL(SUM(p.total), 0) AS ventas
    FROM web_sesion s
    LEFT JOIN web_pedido p ON p.idPedido = s.idPedido AND ${NO_CANCELADO}
    WHERE s.inicio >= @d AND s.inicio < @h
    GROUP BY s.fuente, ISNULL(s.medio, '')
    ORDER BY sesiones DESC`, desde, hasta);

const campanias = (desde, hasta) => consulta(`
    SELECT TOP 15 s.campania, s.fuente, COUNT(*) AS sesiones, COUNT(p.idPedido) AS pedidos, ISNULL(SUM(p.total), 0) AS ventas
    FROM web_sesion s
    LEFT JOIN web_pedido p ON p.idPedido = s.idPedido AND ${NO_CANCELADO}
    WHERE s.inicio >= @d AND s.inicio < @h AND s.campania IS NOT NULL
    GROUP BY s.campania, s.fuente ORDER BY ventas DESC, sesiones DESC`, desde, hasta);

const productosMasVendidos = (desde, hasta) => consulta(`
    SELECT TOP 10 d.idProducto, MAX(d.nombre) AS nombre, MAX(d.codigo) AS codigo,
           SUM(d.cantidad) AS unidades, SUM(d.subtotal) AS ventas
    FROM web_pedido_detalle d INNER JOIN web_pedido p ON p.idPedido = d.idPedido
    WHERE p.fecha >= @d AND p.fecha < @h AND ${NO_CANCELADO}
    GROUP BY d.idProducto ORDER BY ventas DESC`, desde, hasta);

// Productos con muchas visitas pero que casi no se venden (precio, foto o descripción a revisar)
const vistosSinVenta = (desde, hasta) => consulta(`
    WITH vistas AS (
        SELECT e.idProducto, COUNT(DISTINCT e.idSesion) AS vistas
        FROM web_evento e WHERE e.tipo = 'view_item' AND e.fecha >= @d AND e.fecha < @h AND e.idProducto IS NOT NULL
        GROUP BY e.idProducto
    ), carritos AS (
        SELECT e.idProducto, COUNT(DISTINCT e.idSesion) AS carritos
        FROM web_evento e WHERE e.tipo = 'add_to_cart' AND e.fecha >= @d AND e.fecha < @h AND e.idProducto IS NOT NULL
        GROUP BY e.idProducto
    ), ventas AS (
        SELECT d.idProducto, SUM(d.cantidad) AS unidades
        FROM web_pedido_detalle d INNER JOIN web_pedido p ON p.idPedido = d.idPedido
        WHERE p.fecha >= @d AND p.fecha < @h AND ${NO_CANCELADO}
        GROUP BY d.idProducto
    )
    SELECT TOP 10 v.idProducto, RTRIM(pr.nombreProducto) AS nombre, RTRIM(pr.codigo) AS codigo,
           v.vistas, ISNULL(c.carritos, 0) AS carritos, ISNULL(ve.unidades, 0) AS unidades
    FROM vistas v
    INNER JOIN producto pr ON pr.idProducto = v.idProducto
    LEFT JOIN carritos c ON c.idProducto = v.idProducto
    LEFT JOIN ventas ve ON ve.idProducto = v.idProducto
    WHERE ISNULL(ve.unidades, 0) = 0
    ORDER BY v.vistas DESC`, desde, hasta);

const busquedas = async (desde, hasta) => {
    const filas = await consulta(`
        SELECT TOP 40 termino, COUNT(*) AS veces, MIN(ISNULL(resultados, 0)) AS minResultados, MAX(ISNULL(resultados, 0)) AS maxResultados
        FROM web_evento WHERE tipo = 'search' AND fecha >= @d AND fecha < @h AND termino IS NOT NULL
        GROUP BY termino ORDER BY veces DESC`, desde, hasta);
    return {
        top: filas.slice(0, 10).map(({ termino, veces, maxResultados }) => ({ termino, veces, resultados: maxResultados })),
        sinResultados: filas.filter(f => f.maxResultados === 0).slice(0, 10).map(({ termino, veces }) => ({ termino, veces })),
    };
};

const carritosAbandonados = async (desde, hasta) => {
    const [r] = await consulta(`
        SELECT COUNT(*) AS conCarrito,
               SUM(CASE WHEN s.idPedido IS NULL THEN 1 ELSE 0 END) AS abandonados,
               ISNULL(SUM(CASE WHEN s.idPedido IS NULL THEN c.valor END), 0) AS valorAbandonado
        FROM web_sesion s
        CROSS APPLY (SELECT SUM(ISNULL(e.valor, 0)) AS valor FROM web_evento e WHERE e.idSesion = s.idSesion AND e.tipo = 'add_to_cart') c
        WHERE s.inicio >= @d AND s.inicio < @h
          AND EXISTS (SELECT 1 FROM web_evento e WHERE e.idSesion = s.idSesion AND e.tipo = 'add_to_cart')`, desde, hasta);
    const conCarrito = Number(r.conCarrito) || 0;
    const abandonados = Number(r.abandonados) || 0;
    return { conCarrito, abandonados, tasa: conCarrito ? abandonados / conCarrito : 0, valorAbandonado: Number(r.valorAbandonado) || 0 };
};

// Mapa de calor día de la semana x hora (lunes = 1)
const ventasPorHora = (desde, hasta) => consulta(`
    SELECT ((DATEPART(WEEKDAY, p.fecha) + @@DATEFIRST - 2) % 7) + 1 AS diaSemana,
           DATEPART(HOUR, p.fecha) AS hora, COUNT(*) AS pedidos, SUM(p.total) AS ventas
    FROM web_pedido p WHERE p.fecha >= @d AND p.fecha < @h AND ${NO_CANCELADO}
    GROUP BY ((DATEPART(WEEKDAY, p.fecha) + @@DATEFIRST - 2) % 7) + 1, DATEPART(HOUR, p.fecha)`, desde, hasta);

const dispositivos = (desde, hasta) => consulta(`
    SELECT ISNULL(s.dispositivo, 'desconocido') AS dispositivo, COUNT(*) AS sesiones, COUNT(s.idPedido) AS pedidos
    FROM web_sesion s WHERE s.inicio >= @d AND s.inicio < @h
    GROUP BY ISNULL(s.dispositivo, 'desconocido') ORDER BY sesiones DESC`, desde, hasta);

const operacion = async (desde, hasta) => {
    const [pagos, envios, ciudades, estados, [entrega]] = await Promise.all([
        consulta(`SELECT p.metodoPago AS clave, COUNT(*) AS pedidos, SUM(p.total) AS ventas FROM web_pedido p
                  WHERE p.fecha >= @d AND p.fecha < @h AND ${NO_CANCELADO} GROUP BY p.metodoPago ORDER BY pedidos DESC`, desde, hasta),
        consulta(`SELECT p.metodoEnvio AS clave, COUNT(*) AS pedidos, SUM(p.total) AS ventas FROM web_pedido p
                  WHERE p.fecha >= @d AND p.fecha < @h AND ${NO_CANCELADO} GROUP BY p.metodoEnvio ORDER BY pedidos DESC`, desde, hasta),
        consulta(`SELECT TOP 10 CASE WHEN p.metodoEnvio = 'retiro' THEN N'Retiro · sucursal ' + CAST(p.idSucursal AS VARCHAR(10)) ELSE p.ciudad END AS clave,
                         COUNT(*) AS pedidos, SUM(p.total) AS ventas
                  FROM web_pedido p WHERE p.fecha >= @d AND p.fecha < @h AND ${NO_CANCELADO}
                  GROUP BY CASE WHEN p.metodoEnvio = 'retiro' THEN N'Retiro · sucursal ' + CAST(p.idSucursal AS VARCHAR(10)) ELSE p.ciudad END
                  ORDER BY pedidos DESC`, desde, hasta),
        consulta(`SELECT p.estado AS clave, COUNT(*) AS pedidos FROM web_pedido p
                  WHERE p.fecha >= @d AND p.fecha < @h GROUP BY p.estado`, desde, hasta),
        consulta(`SELECT AVG(CAST(DATEDIFF(MINUTE, p.fecha, p.fechaEstado) AS FLOAT)) / 60 AS horas
                  FROM web_pedido p WHERE p.fecha >= @d AND p.fecha < @h AND p.estado = 'entregado' AND p.fechaEstado IS NOT NULL`, desde, hasta),
    ]);
    return { pagos, envios, ciudades, estados, horasAEntrega: entrega?.horas != null ? Number(entrega.horas) : null };
};

// Calidad del catálogo: productos con stock que todavía no tienen foto
const catalogo = async () => {
    const filas = (await executeRequest({
        query: `SELECT p.idProducto, RTRIM(p.codigo) AS codigo
                FROM producto p INNER JOIN stock s ON s.idProducto = p.idProducto
                WHERE p.activo = 1 AND p.precio > 0
                GROUP BY p.idProducto, p.codigo HAVING SUM(s.cantidad) > 0`
    })).recordset;
    const sinFoto = filas.filter(p => !tieneImagen(p.codigo)).length;
    return { conStock: filas.length, sinFoto };
};

// El catálogo no depende del rango y es pesado: se cachea 10 minutos
let cacheCatalogo = { fecha: 0, data: null };
const catalogoCacheado = async () => {
    if (!cacheCatalogo.data || Date.now() - cacheCatalogo.fecha > 10 * 60 * 1000) {
        cacheCatalogo = { fecha: Date.now(), data: await catalogo() };
    }
    return cacheCatalogo.data;
};

export const tablero = async (req, res) => {
    const r = rango(req.query);
    try {
        const [actual, anterior, serie, pasos, porFuente, porCampania, masVendidos, sinVenta, buscado, abandono, horas, disp, op, cat] =
            await Promise.all([
                resumenPeriodo(r.desde, r.hasta),
                resumenPeriodo(r.anteriorDesde, r.anteriorHasta),
                serieDiaria(r.desde, r.hasta),
                embudo(r.desde, r.hasta),
                fuentes(r.desde, r.hasta),
                campanias(r.desde, r.hasta),
                productosMasVendidos(r.desde, r.hasta),
                vistosSinVenta(r.desde, r.hasta),
                busquedas(r.desde, r.hasta),
                carritosAbandonados(r.desde, r.hasta),
                ventasPorHora(r.desde, r.hasta),
                dispositivos(r.desde, r.hasta),
                operacion(r.desde, r.hasta),
                catalogoCacheado(),
            ]);

        res.json({
            respuesta: {
                rango: r,
                resumen: { actual, anterior },
                serie,
                embudo: pasos,
                fuentes: porFuente,
                campanias: porCampania,
                productos: { masVendidos, vistosSinVenta: sinVenta },
                busquedas: buscado,
                carritosAbandonados: abandono,
                ventasPorHora: horas,
                dispositivos: disp,
                operacion: op,
                catalogo: cat,
            }
        });
    } catch (err) {
        console.error("Error en estadísticas:", err);
        res.status(500).json({ error: "No se pudieron calcular las estadísticas" });
    }
};
