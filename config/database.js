const mysql = require("mysql2/promise");

// MYSQL BAĞLANTI HAVUZU
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  port: 3306,
  password: "",        // 🔥 EN ÖNEMLİ SATIR
  database: "sonkds",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;

