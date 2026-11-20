// Panel: usuarios con acceso (sólo rol admin). Cada uno se vincula a un usuario del ERP.
import bcrypt from "bcryptjs";
import sql from "mssql";
import { z } from "zod";
import { executeRequest } from "../../utils/dbHandler.js";
import { auditar } from "../../utils/auditoria.js";

export const listar = async (req, res) => {
    try {
        const result = await executeRequest({
            query: `SELECT uw.idUsuarioWeb, uw.idUsuario, uw.rol, uw.activo, uw.ultimoLogin, uw.fechaAlta,
                           uw.bloqueadoHasta, RTRIM(u.nick) AS nick, u.activo AS activoErp,
                           RTRIM(v.nombre) AS nombre, RTRIM(v.apellido) AS apellido
                    FROM usuarioWeb uw
                    INNER JOIN usuario u ON u.idUsuario = uw.idUsuario
                    LEFT JOIN v_usuario v ON v.idUsuario = uw.idUsuario
                    ORDER BY uw.activo DESC, u.nick`
        });
        res.json({ respuesta: result.recordset.map(u => ({ ...u, activo: Boolean(u.activo), activoErp: Boolean(u.activoErp) })) });
    } catch (err) {
        console.error("Error listando usuarios web:", err);
        res.status(500).json({ error: "No se pudieron obtener los usuarios" });
    }
};

// Usuarios activos del ERP que todavía no tienen acceso al panel
export const candidatosErp = async (req, res) => {
    try {
        const result = await executeRequest({
            query: `SELECT u.idUsuario, RTRIM(u.nick) AS nick, RTRIM(v.nombre) AS nombre, RTRIM(v.apellido) AS apellido,
                           RTRIM(v.nombreGrupoUsuario) AS grupo
                    FROM usuario u
                    LEFT JOIN v_usuario v ON v.idUsuario = u.idUsuario
                    WHERE u.activo = 1 AND NOT EXISTS (SELECT 1 FROM usuarioWeb uw WHERE uw.idUsuario = u.idUsuario)
                    ORDER BY u.nick`
        });
        res.json({ respuesta: result.recordset });
    } catch (err) {
        console.error("Error listando usuarios del ERP:", err);
        res.status(500).json({ error: "No se pudieron obtener los usuarios del ERP" });
    }
};

const password = z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200);

const crearSchema = z.object({
    idUsuario: z.number().int().positive(),
    rol: z.enum(["admin", "editor"]),
    password,
});

export const crear = async (req, res) => {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { idUsuario, rol, password: clave } = parsed.data;
    try {
        const result = await executeRequest({
            query: `IF NOT EXISTS (SELECT 1 FROM usuario WHERE idUsuario = @idUsuario AND activo = 1)
                        SELECT 'no_existe' AS estado
                    ELSE IF EXISTS (SELECT 1 FROM usuarioWeb WHERE idUsuario = @idUsuario)
                        SELECT 'duplicado' AS estado
                    ELSE BEGIN
                        INSERT INTO usuarioWeb (idUsuario, passwordHash, rol) VALUES (@idUsuario, @hash, @rol);
                        SELECT 'ok' AS estado
                    END`,
            inputs: [
                { name: "idUsuario", type: sql.Int, value: idUsuario },
                { name: "hash", type: sql.VarChar(100), value: await bcrypt.hash(clave, 12) },
                { name: "rol", type: sql.VarChar(10), value: rol },
            ]
        });
        const estado = result.recordset[0]?.estado;
        if (estado === "no_existe") return res.status(404).json({ error: "El usuario no existe o está inactivo en el ERP" });
        if (estado === "duplicado") return res.status(409).json({ error: "Ese usuario ya tiene acceso al panel" });
        auditar(req, "usuario.crear", { idUsuario, rol });
        res.status(201).json({ mensaje: "Usuario habilitado" });
    } catch (err) {
        console.error("Error creando usuario web:", err);
        res.status(500).json({ error: "No se pudo habilitar el usuario" });
    }
};

const editarSchema = z.object({
    rol: z.enum(["admin", "editor"]),
    activo: z.boolean(),
    password: password.optional().or(z.literal("")),
});

export const editar = async (req, res) => {
    const id = /^\d+$/.test(req.params.id) ? parseInt(req.params.id) : null;
    const parsed = editarSchema.safeParse(req.body);
    if (!id) return res.status(400).json({ error: "Usuario inválido" });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { rol, activo, password: clave } = parsed.data;

    if (id === req.usuario.idUsuarioWeb && (!activo || rol !== "admin")) {
        return res.status(400).json({ error: "No podés quitarte el rol de administrador ni desactivarte a vos mismo" });
    }

    try {
        await executeRequest({
            query: `UPDATE usuarioWeb
                    SET rol = @rol, activo = @activo,
                        passwordHash = COALESCE(@hash, passwordHash),
                        intentosFallidos = CASE WHEN @hash IS NULL THEN intentosFallidos ELSE 0 END,
                        bloqueadoHasta = CASE WHEN @hash IS NULL THEN bloqueadoHasta ELSE NULL END
                    WHERE idUsuarioWeb = @id`,
            inputs: [
                { name: "id", type: sql.Int, value: id },
                { name: "rol", type: sql.VarChar(10), value: rol },
                { name: "activo", type: sql.Bit, value: activo },
                { name: "hash", type: sql.VarChar(100), value: clave ? await bcrypt.hash(clave, 12) : null },
            ]
        });
        auditar(req, "usuario.editar", { idUsuarioWeb: id, rol, activo, cambioPassword: Boolean(clave) });
        res.json({ mensaje: "Usuario actualizado" });
    } catch (err) {
        console.error("Error editando usuario web:", err);
        res.status(500).json({ error: "No se pudo actualizar el usuario" });
    }
};
