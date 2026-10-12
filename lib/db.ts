import mysql, { type Pool } from "mysql2/promise";

declare global {
  var stokQuMysqlPool: Pool | undefined;
}

export const db =
  globalThis.stokQuMysqlPool ??
  mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || "stokqu",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.stokQuMysqlPool = db;
}
