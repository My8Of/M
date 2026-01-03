const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { SocksProxyAgent } = require("socks-proxy-agent");
const proxyRotator = require("./proxy");
const { processContent } = require("./processor");

const METRICS_FILE = "../../0/metrics.json";

function updateMetrics(status) {
  let metrics = {
    total: 0,
    success: 0,
    private: 0,
    blocked: 0,
    empty: 0,
    error: 0,
  };
  if (fs.existsSync(METRICS_FILE)) {
    try {
      metrics = JSON.parse(fs.readFileSync(METRICS_FILE));
    } catch (e) {
      /* reset se corromper */
    }
  }

  metrics.total++;
  if (status === "SUCCESS") metrics.success++;
  else if (status === "PRIVATE") metrics.private++;
  else if (status === "RATE_LIMIT" || status === "BLOCK") metrics.blocked++;
  else if (status === "EMPTY") metrics.empty++;
  else metrics.error++;

  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
  return metrics;
}

async function fetchJPIContent(id) {
  const url = `https://justpaste.it/${id}`;
  // Pega as configurações do Tor (127.0.0.1:9050)
  const torConfig = await proxyRotator.getNext();

  // Cria o agente SOCKS5. O prefixo 'socks5h' força o DNS a ser resolvido pelo Tor,
  // evitando fugas de IP real (DNS Leaks).
  const agent = new SocksProxyAgent(
    `socks5h://${torConfig.host}:${torConfig.port}`,
  );

  const config = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
    timeout: 15000, // A rede Tor é mais lenta que proxies comuns
    httpAgent: agent,
    httpsAgent: agent,
    validateStatus: (status) => status < 500,
  };

  try {
    const response = await axios.get(url, config);

    if (response.status === 429) {
      updateMetrics("RATE_LIMIT");

      await new Promise((resolve) => setTimeout(resolve, 10000));

      return {
        id,
        success: false,
        status: "RATE_LIMIT",
        error: "Too Many Requests",
      };
    }

    const $ = cheerio.load(response.data);

    // Se o título da página contiver "Cloudflare" ou "Just a moment", é BLOCK
    if (
      response.data.includes("Just a moment...") ||
      response.data.includes("Cloudflare")
    ) {
      return {
        id,
        success: false,
        status: "BLOCK",
        error: "Circuito Tor Marcado",
      };
    }

    if (response.status === 404) {
      return {
        id,
        success: false,
        status: "NOT_FOUND",
        error: "Status 404",
      };
    }

    if (response.status === 403) {
      updateMetrics("PRIVATE");
      return {
        id,
        success: false,
        status: "PRIVATE",
        error: "Status 403",
      };
    }

    const content = $("#articleContent").html();
    if (content && content.trim().length > 0) {
      updateMetrics("SUCCESS");

      // Disparo assíncrono: o minerador continua o loop imediatamente
      processContent(id, content);

      logger.info(`[Miner] Conteúdo de ${id} enviado para refino.`);

      return {
        id,
        success: true,
        status: "SUCCESS",
        rawHtml: content.trim(),
      };
    }

    updateMetrics("EMPTY");
    return {
      id,
      success: false,
      status: "EMPTY",
      error: "Conteúdo não renderizado (Possível Soft-Block)",
    };
  } catch (error) {
    updateMetrics("ERROR");
    return {
      id,
      success: false,
      status: "NETWORK_ERROR",
      error: error.message,
    };
  }
}

if (require.main === module) {
  const testId = process.argv[2];
  fetchJPIContent(testId).then((result) => {
    console.log(JSON.stringify(result, null, 2)); // ESTA LINHA É VITAL
  });
}

module.exports = { fetchJPIContent };
