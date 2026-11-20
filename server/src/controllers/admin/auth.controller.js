import bcrypt from "bcryptjs";
import sql from "mssql";
import { z } from "zod";
import { executeRequest } from "../../utils/dbHandler.js";
import { cerrarSesion, emitirSesion } from "../../middleware/auth.js";

const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;
// Hash ficticio para que el tiempo de respuesta no revele si el usuario existe
const HASH_FICTICIO = bcrypt.hashSync("hash-ficticio", 12);

const loginSchema = z.object({
    nick: z.string().trim().min(1).max(20),
    password: z.string().min(1).max(200),
});

const datosPublicos = (u) => ({
    idUsuarioWeb: u.idUsuarioWeb,
    nick: u.nick,
    nombre: [u.nombre, u.apellido].filter(Boolean).join(" ") || u.nick,
    rol: u.rol,
});

export const login = async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Ingresá usuario y contraseña" });
    const { nick, password } = parsed.data;

    try {
        const result = await executeRequest({
            query: `SELECT uw.idUsuarioWeb, uw.passwordHash, uw.rol, uw.intentosFallidos, uw.bloqueadoHasta,
                           RTRIM(u.nick) AS nick, RTRIM(v.nombre) AS nombre, RTRIM(v.apellido) AS apellido
                    FROM usuario u
                    INNER JOIN usuarioWeb uw ON uw.idUsuario = u.idUsuario
                    LEFT JOIN v_usuario v ON v.idUsuario = u.idUsuario
                    WHERE RTRIM(u.nick) = @nick AND u.activo = 1 AND uw.activo = 1`,
            inputs: [{ name: "nick", type: sql.NVarChar(20), value: nick }]
        });
        const usuario = result.recordset[0];

        if (usuario?.bloqueadoHasta && new Date(usuario.bloqueadoHasta) > new Date()) {
            return res.status(423).json({ error: `Usuario bloqueado por intentos fallidos. Probá en ${BLOQUEO_MIN} minutos.` });
        }

        const ok = await bcrypt.compare(password, usuario?.passwordHash || HASH_FICTICIO);
        if (!usuario || !ok) {
            if (usuario) {
                await executeRequest({
                    query: `UPDATE usuarioWeb
                            SET intentosFallidos = intentosFallidos + 1,
                                bloqueadoHasta = CASE WHEN intentosFallidos + 1 >= @max
                                                      THEN DATEADD(MINUTE, @min, SYSDATETIME()) ELSE NULL END
                            WHERE idUsuarioWeb = @id`,
                    inputs: [
                        { name: "id", type: sql.Int, value: usuario.idUsuarioWeb },
                        { name: "max", type: sql.Int, value: MAX_INTENTOS },
                        { name: "min", type: sql.Int, value: BLOQUEO_MIN },
                    ]
                });
            }
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        await executeRequest({
            query: `UPDATE usuarioWeb SET intentosFallidos = 0, bloqueadoHasta = NULL, ultimoLogin = SYSDATETIME()
                    WHERE idUsuarioWeb = @id`,
            inputs: [{ name: "id", type: sql.Int, value: usuario.idUsuarioWeb }]
        });

        emitirSesion(res, usuario);
        res.json({ respuesta: datosPublicos(usuario) });
    } catch (err) {
        console.error("Error en login admin:", err);
        res.status(500).json({ error: "No se pudo iniciar sesión" });
    }
};

export const me = (req, res) => res.json({ respuesta: datosPublicos(req.usuario) });

export const logout = (req, res) => {
    cerrarSesion(res);
    res.json({ mensaje: "Sesión cerrada" });
};

const passwordSchema = z.object({
    actual: z.string().min(1),
    nueva: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export const cambiarPassword = async (req, res) => {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const result = await executeRequest({
        query: `SELECT passwordHash FROM usuarioWeb WHERE idUsuarioWeb = @id`,
        inputs: [{ name: "id", type: sql.Int, value: req.usuario.idUsuarioWeb }]
    });
    if (!(await bcrypt.compare(parsed.data.actual, result.recordset[0]?.passwordHash || HASH_FICTICIO))) {
        return res.status(400).json({ error: "La contraseña actual no es correcta" });
    }
    await executeRequest({
        query: `UPDATE usuarioWeb SET passwordHash = @hash WHERE idUsuarioWeb = @id`,
        inputs: [
            { name: "id", type: sql.Int, value: req.usuario.idUsuarioWeb },
            { name: "hash", type: sql.VarChar(100), value: await bcrypt.hash(parsed.data.nueva, 12) },
        ]
    });
    res.json({ mensaje: "Contraseña actualizada" });
};
