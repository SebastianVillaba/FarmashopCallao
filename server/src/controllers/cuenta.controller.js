// Cuentas de clientes de la tienda: registro, login, perfil, favoritos y pedidos.
import bcrypt from "bcryptjs";
import sql from "mssql";
import { z } from "zod";
import { executeRequest, withTransaction } from "../utils/dbHandler.js";
import { getImagenes } from "../utils/imageIndex.js";
import { cerrarSesionCliente, consultarCliente, emitirSesionCliente } from "../middleware/authCliente.js";
import { productosPorIds } from "./producto.controller.js";

const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;
const MAX_FAVORITOS = 200;
// Hash ficticio para que el tiempo de respuesta no revele si el email está registrado
const HASH_FICTICIO = bcrypt.hashSync("hash-ficticio", 12);

const texto = (max) => z.string().trim().max(max);
const opcional = (max) => texto(max).optional().or(z.literal("")).transform(v => v || null);

const email = z.string().trim().toLowerCase().email("Email inválido").max(150);
const telefono = texto(30).regex(/^[0-9+\s()-]{6,30}$/, "Celular inválido");
const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200);

// Lo que ve el propio cliente (nunca el hash ni datos internos)
export const datosCliente = (c) => ({
    idCliente: c.idCliente,
    email: c.email,
    nombre: c.nombre,
    apellido: c.apellido,
    telefono: c.telefono,
    documento: c.documento,
    dv: c.dv,
    razonSocial: c.razonSocial,
    metodoEnvio: c.metodoEnvio,
    idSucursal: c.idSucursal,
    calle: c.calle,
    calleSecundaria: c.calleSecundaria,
    referencia: c.referencia,
    ciudad: c.ciudad,
    aceptaComunicaciones: Boolean(c.aceptaComunicaciones),
    emailVerificado: Boolean(c.emailVerificado),
    fechaAlta: c.fechaAlta,
});

const primerError = (parsed) => parsed.error.issues[0]?.message || "Datos inválidos";

// ---------------------------------------------------------------- Registro y sesión

const registroSchema = z.object({
    nombre: texto(100).min(2, "Ingresá tu nombre"),
    apellido: texto(100).min(2, "Ingresá tu apellido"),
    email,
    telefono,
    password,
    aceptaTerminos: z.literal(true, { message: "Tenés que aceptar los términos y la política de privacidad" }),
    aceptaComunicaciones: z.boolean().optional().default(false),
});

export const registro = async (req, res) => {
    const parsed = registroSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: primerError(parsed) });
    const d = parsed.data;

    try {
        const hash = await bcrypt.hash(d.password, 12);
        const result = await executeRequest({
            query: `IF EXISTS (SELECT 1 FROM web_cliente WHERE email = @email)
                        SELECT CAST(NULL AS INT) AS idCliente
                    ELSE
                        INSERT INTO web_cliente (email, passwordHash, nombre, apellido, telefono,
                                                 aceptaComunicaciones, fechaConsentimiento)
                        OUTPUT INSERTED.idCliente
                        VALUES (@email, @hash, @nombre, @apellido, @telefono,
                                @acepta, CASE WHEN @acepta = 1 THEN SYSDATETIME() ELSE NULL END)`,
            inputs: [
                { name: "email", type: sql.VarChar(150), value: d.email },
                { name: "hash", type: sql.VarChar(255), value: hash },
                { name: "nombre", type: sql.NVarChar(100), value: d.nombre },
                { name: "apellido", type: sql.NVarChar(100), value: d.apellido },
                { name: "telefono", type: sql.VarChar(30), value: d.telefono },
                { name: "acepta", type: sql.Bit, value: d.aceptaComunicaciones },
            ]
        });
        const idCliente = result.recordset[0]?.idCliente;
        if (!idCliente) {
            return res.status(409).json({ error: "Ya existe una cuenta con ese email. Ingresá con tu contraseña." });
        }

        const cliente = await consultarCliente(idCliente);
        emitirSesionCliente(res, cliente);
        res.status(201).json({ respuesta: datosCliente(cliente) });
    } catch (err) {
        // Carrera entre dos registros con el mismo email (índice único)
        if (err?.number === 2627 || err?.number === 2601) {
            return res.status(409).json({ error: "Ya existe una cuenta con ese email. Ingresá con tu contraseña." });
        }
        console.error("Error en registro de cliente:", err);
        res.status(500).json({ error: "No pudimos crear tu cuenta, intentá de nuevo" });
    }
};

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().min(1).max(150),
    password: z.string().min(1).max(200),
});

export const login = async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Ingresá tu email y contraseña" });
    const { email: correo, password: clave } = parsed.data;

    try {
        const result = await executeRequest({
            query: `SELECT idCliente, passwordHash, bloqueadoHasta FROM web_cliente WHERE email = @email AND activo = 1`,
            inputs: [{ name: "email", type: sql.VarChar(150), value: correo }]
        });
        const fila = result.recordset[0];

        if (fila?.bloqueadoHasta && new Date(fila.bloqueadoHasta) > new Date()) {
            return res.status(423).json({ error: `Cuenta bloqueada por intentos fallidos. Probá de nuevo en ${BLOQUEO_MIN} minutos.` });
        }

        // Las cuentas sin contraseña (reservadas) nunca pueden ingresar
        const ok = await bcrypt.compare(clave, fila?.passwordHash || HASH_FICTICIO);
        if (!fila || !fila.passwordHash || !ok) {
            if (fila) {
                await executeRequest({
                    query: `UPDATE web_cliente
                            SET intentosFallidos = intentosFallidos + 1,
                                bloqueadoHasta = CASE WHEN intentosFallidos + 1 >= @max
                                                      THEN DATEADD(MINUTE, @min, SYSDATETIME()) ELSE NULL END
                            WHERE idCliente = @id`,
                    inputs: [
                        { name: "id", type: sql.Int, value: fila.idCliente },
                        { name: "max", type: sql.Int, value: MAX_INTENTOS },
                        { name: "min", type: sql.Int, value: BLOQUEO_MIN },
                    ]
                });
            }
            return res.status(401).json({ error: "Email o contraseña incorrectos" });
        }

        await executeRequest({
            query: `UPDATE web_cliente SET intentosFallidos = 0, bloqueadoHasta = NULL, ultimoLogin = SYSDATETIME()
                    WHERE idCliente = @id`,
            inputs: [{ name: "id", type: sql.Int, value: fila.idCliente }]
        });

        const cliente = await consultarCliente(fila.idCliente);
        emitirSesionCliente(res, cliente);
        res.json({ respuesta: datosCliente(cliente) });
    } catch (err) {
        console.error("Error en login de cliente:", err);
        res.status(500).json({ error: "No pudimos iniciar sesión, intentá de nuevo" });
    }
};

export const logout = (req, res) => {
    cerrarSesionCliente(res);
    res.json({ mensaje: "Sesión cerrada" });
};

export const me = (req, res) => res.json({ respuesta: datosCliente(req.cliente) });

// ---------------------------------------------------------------- Perfil

const perfilSchema = z.object({
    nombre: texto(100).min(2, "Ingresá tu nombre"),
    apellido: texto(100).min(2, "Ingresá tu apellido"),
    telefono,
    documento: texto(20).regex(/^[0-9A-Za-z.-]{3,20}$/, "Documento inválido").optional().or(z.literal("")).transform(v => v || null),
    dv: opcional(2),
    razonSocial: opcional(150),
    metodoEnvio: z.enum(["retiro", "delivery"]).nullable().optional().or(z.literal("")).transform(v => v || null),
    idSucursal: z.coerce.number().int().positive().nullable().optional().or(z.literal("")).transform(v => v || null),
    calle: opcional(150),
    calleSecundaria: opcional(150),
    referencia: opcional(250),
    ciudad: opcional(100),
    aceptaComunicaciones: z.boolean(),
});

// Guarda el perfil. También lo usa el checkout ("guardar estos datos en mi cuenta").
export const guardarPerfil = async (idCliente, p, nuevoRequest) => {
    const request = nuevoRequest ? nuevoRequest() : null;
    const query = `UPDATE web_cliente SET
                        nombre = @nombre, apellido = @apellido, telefono = @telefono,
                        documento = @documento, dv = @dv, razonSocial = @razonSocial,
                        metodoEnvio = @metodoEnvio, idSucursal = @idSucursal,
                        calle = @calle, calleSecundaria = @calleSecundaria, referencia = @referencia, ciudad = @ciudad,
                        fechaConsentimiento = CASE WHEN @acepta = 1 AND aceptaComunicaciones = 0 THEN SYSDATETIME()
                                                   WHEN @acepta = 0 THEN NULL ELSE fechaConsentimiento END,
                        aceptaComunicaciones = @acepta
                    WHERE idCliente = @id`;
    const inputs = [
        { name: "id", type: sql.Int, value: idCliente },
        { name: "nombre", type: sql.NVarChar(100), value: p.nombre },
        { name: "apellido", type: sql.NVarChar(100), value: p.apellido },
        { name: "telefono", type: sql.VarChar(30), value: p.telefono },
        { name: "documento", type: sql.VarChar(20), value: p.documento },
        { name: "dv", type: sql.VarChar(2), value: p.dv },
        { name: "razonSocial", type: sql.NVarChar(150), value: p.razonSocial },
        { name: "metodoEnvio", type: sql.VarChar(20), value: p.metodoEnvio },
        { name: "idSucursal", type: sql.Int, value: p.idSucursal },
        { name: "calle", type: sql.NVarChar(150), value: p.calle },
        { name: "calleSecundaria", type: sql.NVarChar(150), value: p.calleSecundaria },
        { name: "referencia", type: sql.NVarChar(250), value: p.referencia },
        { name: "ciudad", type: sql.NVarChar(100), value: p.ciudad },
        { name: "acepta", type: sql.Bit, value: p.aceptaComunicaciones },
    ];
    if (!request) return executeRequest({ query, inputs });
    inputs.forEach(({ name, type, value }) => request.input(name, type, value));
    return request.query(query);
};

export const actualizarPerfil = async (req, res) => {
    const parsed = perfilSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: primerError(parsed) });
    try {
        await guardarPerfil(req.cliente.idCliente, parsed.data);
        const cliente = await consultarCliente(req.cliente.idCliente);
        res.json({ mensaje: "Datos guardados", respuesta: datosCliente(cliente) });
    } catch (err) {
        console.error("Error actualizando perfil de cliente:", err);
        res.status(500).json({ error: "No pudimos guardar tus datos" });
    }
};

const emailSchema = z.object({ email, password: z.string().min(1).max(200) });

export const cambiarEmail = async (req, res) => {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: primerError(parsed) });
    try {
        const actual = await executeRequest({
            query: `SELECT passwordHash FROM web_cliente WHERE idCliente = @id`,
            inputs: [{ name: "id", type: sql.Int, value: req.cliente.idCliente }]
        });
        if (!(await bcrypt.compare(parsed.data.password, actual.recordset[0]?.passwordHash || HASH_FICTICIO))) {
            return res.status(400).json({ error: "La contraseña no es correcta" });
        }
        const result = await executeRequest({
            query: `IF EXISTS (SELECT 1 FROM web_cliente WHERE email = @email AND idCliente <> @id)
                        SELECT 0 AS ok
                    ELSE BEGIN
                        UPDATE web_cliente SET email = @email, emailVerificado = 0 WHERE idCliente = @id;
                        SELECT 1 AS ok;
                    END`,
            inputs: [
                { name: "id", type: sql.Int, value: req.cliente.idCliente },
                { name: "email", type: sql.VarChar(150), value: parsed.data.email },
            ]
        });
        if (!result.recordset[0]?.ok) return res.status(409).json({ error: "Ese email ya está registrado en otra cuenta" });
        const cliente = await consultarCliente(req.cliente.idCliente);
        res.json({ mensaje: "Email actualizado", respuesta: datosCliente(cliente) });
    } catch (err) {
        console.error("Error cambiando email de cliente:", err);
        res.status(500).json({ error: "No pudimos cambiar tu email" });
    }
};

const passwordSchema = z.object({ actual: z.string().min(1), nueva: password });

export const cambiarPassword = async (req, res) => {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: primerError(parsed) });
    try {
        const actual = await executeRequest({
            query: `SELECT passwordHash FROM web_cliente WHERE idCliente = @id`,
            inputs: [{ name: "id", type: sql.Int, value: req.cliente.idCliente }]
        });
        if (!(await bcrypt.compare(parsed.data.actual, actual.recordset[0]?.passwordHash || HASH_FICTICIO))) {
            return res.status(400).json({ error: "La contraseña actual no es correcta" });
        }
        // Subir la versión cierra la sesión en los demás dispositivos
        const result = await executeRequest({
            query: `UPDATE web_cliente SET passwordHash = @hash, versionSesion = versionSesion + 1
                    OUTPUT INSERTED.versionSesion
                    WHERE idCliente = @id`,
            inputs: [
                { name: "id", type: sql.Int, value: req.cliente.idCliente },
                { name: "hash", type: sql.VarChar(255), value: await bcrypt.hash(parsed.data.nueva, 12) },
            ]
        });
        emitirSesionCliente(res, { idCliente: req.cliente.idCliente, versionSesion: result.recordset[0].versionSesion });
        res.json({ mensaje: "Contraseña actualizada" });
    } catch (err) {
        console.error("Error cambiando contraseña de cliente:", err);
        res.status(500).json({ error: "No pudimos cambiar tu contraseña" });
    }
};

// ---------------------------------------------------------------- Favoritos

const idsFavoritos = async (idCliente) => {
    const result = await executeRequest({
        query: `SELECT idProducto FROM web_cliente_favorito WHERE idCliente = @id ORDER BY fecha DESC`,
        inputs: [{ name: "id", type: sql.Int, value: idCliente }]
    });
    return result.recordset.map(r => r.idProducto);
};

export const listarFavoritos = async (req, res) => {
    try {
        res.json({ respuesta: await productosPorIds(await idsFavoritos(req.cliente.idCliente)) });
    } catch (err) {
        console.error("Error listando favoritos:", err);
        res.status(500).json({ error: "No pudimos obtener tus favoritos" });
    }
};

const idProducto = (valor) => (/^\d+$/.test(String(valor)) ? parseInt(valor) : null);

export const agregarFavorito = async (req, res) => {
    const id = idProducto(req.params.idProducto);
    if (!id) return res.status(400).json({ error: "Producto inválido" });
    try {
        const result = await executeRequest({
            query: `IF NOT EXISTS (SELECT 1 FROM producto WHERE idProducto = @idProducto)
                        SELECT 'no_existe' AS estado
                    ELSE IF (SELECT COUNT(*) FROM web_cliente_favorito WHERE idCliente = @idCliente) >= @max
                        SELECT 'limite' AS estado
                    ELSE BEGIN
                        IF NOT EXISTS (SELECT 1 FROM web_cliente_favorito WHERE idCliente = @idCliente AND idProducto = @idProducto)
                            INSERT INTO web_cliente_favorito (idCliente, idProducto) VALUES (@idCliente, @idProducto);
                        SELECT 'ok' AS estado;
                    END`,
            inputs: [
                { name: "idCliente", type: sql.Int, value: req.cliente.idCliente },
                { name: "idProducto", type: sql.Int, value: id },
                { name: "max", type: sql.Int, value: MAX_FAVORITOS },
            ]
        });
        const estado = result.recordset[0]?.estado;
        if (estado === "no_existe") return res.status(404).json({ error: "Producto no encontrado" });
        if (estado === "limite") return res.status(409).json({ error: `Podés guardar hasta ${MAX_FAVORITOS} favoritos` });
        res.json({ mensaje: "Agregado a favoritos" });
    } catch (err) {
        // Doble clic: la PK ya existe
        if (err?.number === 2627) return res.json({ mensaje: "Agregado a favoritos" });
        console.error("Error agregando favorito:", err);
        res.status(500).json({ error: "No pudimos guardar el favorito" });
    }
};

export const quitarFavorito = async (req, res) => {
    const id = idProducto(req.params.idProducto);
    if (!id) return res.status(400).json({ error: "Producto inválido" });
    try {
        await executeRequest({
            query: `DELETE FROM web_cliente_favorito WHERE idCliente = @idCliente AND idProducto = @idProducto`,
            inputs: [
                { name: "idCliente", type: sql.Int, value: req.cliente.idCliente },
                { name: "idProducto", type: sql.Int, value: id },
            ]
        });
        res.json({ mensaje: "Quitado de favoritos" });
    } catch (err) {
        console.error("Error quitando favorito:", err);
        res.status(500).json({ error: "No pudimos quitar el favorito" });
    }
};

const sincronizarSchema = z.object({
    ids: z.array(z.coerce.number().int().positive()).max(MAX_FAVORITOS),
});

// Al ingresar, los favoritos guardados en el navegador se suman a los de la cuenta
export const sincronizarFavoritos = async (req, res) => {
    const parsed = sincronizarSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Favoritos inválidos" });
    const idCliente = req.cliente.idCliente;
    try {
        const existentes = new Set(await idsFavoritos(idCliente));
        const lugar = Math.max(0, MAX_FAVORITOS - existentes.size);
        const nuevos = [...new Set(parsed.data.ids)].filter(id => !existentes.has(id)).slice(0, lugar);

        if (nuevos.length) {
            await withTransaction(async (nuevoRequest) => {
                // Sólo productos que existen (evita errores de FK por ids viejos del navegador)
                const request = nuevoRequest().input("idCliente", sql.Int, idCliente);
                nuevos.forEach((id, i) => request.input(`p${i}`, sql.Int, id));
                await request.query(`INSERT INTO web_cliente_favorito (idCliente, idProducto)
                                     SELECT @idCliente, p.idProducto
                                     FROM producto p
                                     WHERE p.idProducto IN (${nuevos.map((_, i) => `@p${i}`).join(", ")})
                                       AND NOT EXISTS (SELECT 1 FROM web_cliente_favorito f
                                                       WHERE f.idCliente = @idCliente AND f.idProducto = p.idProducto)`);
            });
        }
        res.json({ respuesta: await productosPorIds(await idsFavoritos(idCliente)) });
    } catch (err) {
        console.error("Error sincronizando favoritos:", err);
        res.status(500).json({ error: "No pudimos sincronizar tus favoritos" });
    }
};

// ---------------------------------------------------------------- Pedidos

export const misPedidos = async (req, res) => {
    try {
        const cabeceras = await executeRequest({
            query: `SELECT TOP 50 idPedido, nroPedido, fecha, estado, metodoEnvio, metodoPago, total, email
                    FROM web_pedido
                    WHERE idCliente = @id
                    ORDER BY fecha DESC`,
            inputs: [{ name: "id", type: sql.Int, value: req.cliente.idCliente }]
        });
        const pedidos = cabeceras.recordset;
        if (!pedidos.length) return res.json({ respuesta: [] });

        // Resumen de ítems para la vista previa (cantidad y primeras imágenes)
        const inputs = pedidos.map((p, i) => ({ name: `p${i}`, type: sql.Int, value: p.idPedido }));
        const detalle = await executeRequest({
            query: `SELECT idPedido, codigo, nombre, cantidad
                    FROM web_pedido_detalle
                    WHERE idPedido IN (${inputs.map(i => "@" + i.name).join(", ")})
                    ORDER BY idDetalle`,
            inputs
        });
        const porPedido = new Map();
        for (const d of detalle.recordset) {
            if (!porPedido.has(d.idPedido)) porPedido.set(d.idPedido, []);
            porPedido.get(d.idPedido).push(d);
        }

        res.json({
            respuesta: pedidos.map(({ idPedido, ...p }) => {
                const items = porPedido.get(idPedido) || [];
                return {
                    ...p,
                    cantidadItems: items.reduce((acc, d) => acc + d.cantidad, 0),
                    vistaPrevia: items.slice(0, 4).map(d => ({ nombre: d.nombre, imagen: getImagenes(d.codigo)[0] || null })),
                };
            })
        });
    } catch (err) {
        console.error("Error listando pedidos del cliente:", err);
        res.status(500).json({ error: "No pudimos obtener tus pedidos" });
    }
};
