const winston = require("winston");
const Parser = require("rss-parser");
const fs = require("fs");
const parser = new Parser();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "M/0/spider.log" }), // Movido para M/0
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

function getSources() {
  try {
    const data = fs.readFileSync("M/0/.links", "utf8");
    return data.split("\n")
      .filter(line => line.trim() && !line.startsWith("#"))
      .map(line => {
        const [name, url, layer] = line.split("|");
        return { name, url, layer: parseInt(layer) };
      })
      .filter(src => src.layer === 2); // Apenas Camada 2
  } catch (err) {
    logger.error(`Erro ao ler M/0/.links: ${err.message}`);
    return [];
  }
}

async function monitorFeeds() {
  const feeds = getSources();
  logger.info(`Rastreando ${feeds.length} fontes na Camada 2...`);

  for (const feed of feeds) {
    try {
      const content = await parser.parseURL(feed.url);
      content.items.forEach((item) => {
        const query = (item.title + item.content).toLowerCase();
        if (query.includes("key") || query.includes("vulnerability") || query.includes("leak")) {
          logger.warn(`ALERTA [${feed.name}]: ${item.title} - ${item.link}`);
        }
      });
    } catch (error) {
      logger.error(`Erro em ${feed.name}: ${error.message}`);
    }
  }
}

setInterval(monitorFeeds, 5 * 60 * 1000);
monitorFeeds();
