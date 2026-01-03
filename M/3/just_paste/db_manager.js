const mysql = require("mysql2/promise");
require("dotenv").config({
  path: require("path").join(__dirname, "../../../.env"),
});

class DBManager {
  constructor() {
    this.config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    };
  }

  async setup() {
    const connection = await mysql.createConnection({
      host: this.config.host,
      user: this.config.user,
      password: this.config.password,
    });

    await connection.changeUser({ database: this.config.database });

    // Criando a tabela com as colunas solicitadas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS extractions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          seed VARCHAR(50) NOT NULL,
          texto LONGTEXT,    -- Armazena o conteúdo bruto limpo de tags
          links LONGTEXT,    -- Armazena todos os URLs encontrados (Onion, Telegram, HTTP)
          data_coleta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
        `);
    await connection.end();
    console.log("[DB] Setup concluído com sucesso.");
  }

  async save(data) {
    const connection = await mysql.createConnection(this.config);
    const query =
      "INSERT INTO extractions (seed, texto, links) VALUES (?, ?, ?)";
    try {
      await connection.execute(query, [data.seed, data.texto, data.links]);
    } finally {
      await connection.end();
    }
  }
}

module.exports = new DBManager();
