const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "../../../.env") });
const SerpApi = require("google-search-results-nodejs");
const search = new SerpApi.GoogleSearch(process.env.SERPAPI_KEY);

const SEEDS_FILE = path.join(__dirname, "../../../M/0/seeds.txt");

/**
 * jpt_dork.js - O Zelador via SerpApi
 * Busca novas sementes de forma modular.
 */
async function fetchNewSeeds() {
  const dorks = [
    'site:justpaste.it "notes" after:2025-12-01',
    'site:justpaste.it "text" after:2025-12-01',
    'site:justpaste.it "read more" after:2025-12-01',
  ];

  const query = dorks[Math.floor(Math.random() * dorks.length)];

  return new Promise((resolve) => {
    console.log(`[Dork] Consultando SerpApi: "${query}"`);

    search.json(
      {
        q: query,
        num: 20,
      },
      (data) => {
        if (data.error) {
          console.error(`[Dork][ERRO] SerpApi: ${data.error}`);
          return resolve(0);
        }

        const results = data.organic_results || [];
        let newCount = 0;

        if (!fs.existsSync(SEEDS_FILE)) {
          fs.mkdirSync(path.dirname(SEEDS_FILE), { recursive: true });
          fs.writeFileSync(SEEDS_FILE, "");
        }

        const existingSeeds = fs.readFileSync(SEEDS_FILE, "utf8").split("\n");

        results.forEach((result) => {
          const url = result.link;
          const match = url.match(/justpaste\.it\/([a-z0-9]+)/);

          if (match && match[1]) {
            const seed = match[1];
            if (!existingSeeds.includes(seed)) {
              fs.appendFileSync(SEEDS_FILE, seed + "\n");
              newCount++;
              existingSeeds.push(seed);
            }
          }
        });

        console.log(`[Dork] Colheita finalizada: ${newCount} novas seeds.`);
        resolve(newCount);
      },
    );
  });
}

/**
 * TESTE MODULAR
 * Permite rodar: node M/3/just_paste/dork.js
 */
if (require.main === module) {
  console.log("--- Iniciando Teste Modular: Dork ---");
  if (!process.env.SERPAPI_KEY) {
    console.error("[!] ERRO: SERPAPI_KEY não encontrada no .env");
    process.exit(1);
  }

  fetchNewSeeds().then((count) => {
    console.log(`Teste concluído. Seeds colhidas: ${count}`);
    process.exit(0);
  });
}

module.exports = { fetchNewSeeds };
