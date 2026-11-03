const mysql = require("mysql2/promise");

const url = new URL(process.env.DATABASE_URL || "mysql://root:password@localhost:3306/linkedin_optimizer");

const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4"
});

module.exports = pool;
