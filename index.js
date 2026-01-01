const winston = require("winston");
const Parser = require("rss-parser");
const parser = new Parser();

// Configuração do Logger (Persistência em arquivo)
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "intelligence.log" }), // Persistência!
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

const feeds = [
  {
    name: "Full Disclosure (Segurança)",
    url: "https://seclists.org/rss/fulldisclosure.rss",
  },
  {
    name: "Hacker News (Filtro de Elite)",
    url: "https://news.ycombinator.com/rss",
  },
];

async function monitorFeeds() {
  logger.info("Iniciando rastreamento de inteligência...");

  for (const feed of feeds) {
    try {
      const content = await parser.parseURL(feed.url);
      content.items.forEach((item) => {
        if (
          item.title.toLowerCase().includes("key") ||
          item.content.toLowerCase().includes("vulnerability")
        ) {
          logger.warn(
            `ALERTA: Possível brecha em ${feed.name}: ${item.title} - ${item.link}`,
          );
        }
      });
    } catch (error) {
      logger.error(`Erro ao acessar ${feed.name}: ${error.message}`);
    }
  }
}

// Executa a cada 5 minutos
setInterval(monitorFeeds, 5 * 60 * 1000);
monitorFeeds();
