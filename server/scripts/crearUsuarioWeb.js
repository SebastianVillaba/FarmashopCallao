// Crea (o resetea) un usuario del panel a partir de un usuario del ERP.
// Uso:  node scripts/crearUsuarioWeb.js <nick> <contraseña> [admin|editor]
import bcrypt from "bcryptjs";
import sql from "mssql";
import { executeRequest } from "../src/utils/dbHandler.js";

const [nick, password, rol = "admin"] = process.argv.slice(2);

if (!nick || !password || !["admin", "editor"].includes(rol)) {
    console.log("Uso: node scripts/crearUsuarioWeb.js <nick> <contraseña> [admin|editor]");
    process.exit(1);
}
if (password.length < 8) {
    console.log("La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
}

try {
    const usuario = (await executeRequest({
        query: `SELECT idUsuario, RTRIM(nick) AS nick FROM usuario WHERE RTRIM(nick) = @nick AND activo = 1`,
        inputs: [{ name: "nick", type: sql.NVarChar(20), value: nick }]
    })).recordset[0];

    if (!usuario) {
        console.log(`No existe un usuario activo con nick "${nick}" en el ERP.`);
        process.exit(1);
    }

    await executeRequest({
        query: `MERGE usuarioWeb AS t
                USING (SELECT @idUsuario AS idUsuario) AS s ON t.idUsuario = s.idUsuario
                WHEN MATCHED THEN UPDATE SET passwordHash = @hash, rol = @rol, activo = 1, intentosFallidos = 0, bloqueadoHasta = NULL
                WHEN NOT MATCHED THEN INSERT (idUsuario, passwordHash, rol) VALUES (@idUsuario, @hash, @rol);`,
        inputs: [
            { name: "idUsuario", type: sql.Int, value: usuario.idUsuario },
            { name: "hash", type: sql.VarChar(100), value: await bcrypt.hash(password, 12) },
            { name: "rol", type: sql.VarChar(10), value: rol },
        ]
    });
    console.log(`Listo: "${usuario.nick}" puede ingresar al panel con rol ${rol}.`);
    process.exit(0);
} catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
}
