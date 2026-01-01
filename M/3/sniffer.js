const axios = require("axios");
const fs = require("fs");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "M/0/sniffer.log" }), // Log centralizado em M/0
  ],
});

// Dentro de M/3/sniffer.js
const patterns = {
  // --- OURO (APIs e Chaves) ---
  asaas: /\$aact_(?:prod|hmlg)_[a-zA-Z0-9]+/,
  stripe: /(?:sk|pk)_(?:live|test)_[a-zA-Z0-9]{24,}/,
  aws: /AKIA[0-9A-Z]{16}/,
  openai: /sk-[a-zA-Z0-9-]{48}/,
  anthropic: /sk-ant-api03-[a-z0-9-_]{93,}/i,
  gemini: /AIza[0-9A-Za-z-_]{35}/,
  supabase: /sbp_[a-zA-Z0-9]{40,}/, // Cobre as service_role keys do Supabase

  // --- COBRE (Novas Fontes e Grupos) ---
  // Estes são links que o sniffer vai "catar" para você entrar em novos grupos
  telegram_invite: /t\.me\/(?:\+|joinchat\/)[a-zA-Z0-9_-]{16,}/,
  discord_invite: /discord\.(?:gg|com\/invite)\/[a-zA-Z0-9-]+/,

  // --- CHUMBO (Dados Sistêmicos) ---
  onion_v3: /[a-z2-7]{56}\.onion/, // Mirrors de fóruns na rede Tor
  env_leak: /DB_(?:PASSWORD|HOST|USERNAME)=[^\s]+/, // Configurações expostas
};

function getSources() {
  try {
    const data = fs.readFileSync("M/0/.links", "utf8");
    return data
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => {
        const [name, url, layer] = line.split("|");
        return { name, url, layer: parseInt(layer) };
      })
      .filter((src) => src.layer === 3); // Apenas Camada 3
  } catch (err) {
    logger.error(`Erro ao carregar fontes: ${err.message}`);
    return [];
  }
}

async function checkPaste(content, sourceName) {
  for (const [type, regex] of Object.entries(patterns)) {
    if (regex.test(content)) {
      const id = Date.now();
      // Se for link de convite, classificamos como 'cobre'
      const categoria =
        type.includes("invite") || type.includes("onion") ? "cobre" : "ouro";
      const fileName = `M/4/${categoria}_${id}.md`;

      const metadata = `---
id: ${id}
tipo: ${type}
categoria: ${categoria}
origem: ${sourceName}
---
# Conteúdo Extraído
\`\`\`
${content.match(regex)[0]}
\`\`\`
`;
      fs.writeFileSync(fileName, metadata);
      logger.info(
        `Material detectado! Categoria: ${categoria} | Tipo: ${type}`,
      );
    }
  }
}

async function runSniffer() {
  const targets = getSources();
  for (const target of targets) {
    try {
      const response = await axios.get(target.url, { timeout: 10000 });
      await checkPaste(JSON.stringify(response.data), target.name);
    } catch (error) {
      logger.error(`Falha no alvo ${target.name}: ${error.message}`);
    }
  }
}

setInterval(runSniffer, 60000);
runSniffer();
