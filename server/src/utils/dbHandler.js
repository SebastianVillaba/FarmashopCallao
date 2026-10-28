// dbHandler.js
import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config = {
  server: process.env.DB_IP_LAN,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};


let poolPromise;

export function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log("Conectado a la base de datos");
        return pool;
      })
      .catch((err) => {
        console.error("Error al conectar a la base de datos:", err);
        throw err;
      });
  }
  return poolPromise;
}

export async function executeRequest({
  query,
  inputs = [],
  outputs = [],
  isStoredProcedure = false,
}) {
  //console.log("Parámetros enviados al SP:", inputs); <--  PARA VER QUE INPUTS ESTOY ENVIANDO
  try {
    const pool = await getPool();
    const request = pool.request();

    // Agregar parámetros de entrada
    inputs.forEach(({ name, type, value }) => {
      request.input(name, type, value);
    });

    // Agregar parámetros de salida
    outputs.forEach(({ name, type }) => {
      request.output(name, type);
    });

    const result = isStoredProcedure
      ? await request.execute(query)
      : await request.query(query);

      
    return result;
  } catch (error) {
    console.error("Error en executeRequest:", error);
    throw error;
  }
}

// Ejecuta varias consultas dentro de una transacción.
// El callback recibe una función para crear requests ligados a la transacción.
export async function withTransaction(callback) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await callback(() => new sql.Request(transaction));
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al hacer rollback:", rollbackError);
    }
    throw error;
  }
}
