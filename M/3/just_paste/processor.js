const cheerio = require("cheerio");
const db = require("./db_manager");

async function processContent(seed, rawHtml) {
  setImmediate(async () => {
    try {
      const $ = cheerio.load(rawHtml);

      // Remove elementos que geram falso-positivo ou ruído
      $("script, style, iframe, noscript").remove();

      const foundLinks = new Set();

      // --- PASSO 1: EXTRAÇÃO DE ATRIBUTOS (HREF/SRC) ---
      $("[href], [src]").each((i, el) => {
        const val = $(el).attr("href") || $(el).attr("src");
        if (val && val.length > 3 && !val.startsWith("data:")) {
          foundLinks.add(val.trim());
        }
      });

      // --- PASSO 2: EXTRAÇÃO DE TEXTO ESTRUTURADA ---
      // Injetamos quebras de linha em tags de bloco para garantir separação
      $("p, div, br, h1, h2, h3, li, tr").after("\n");
      const fullText = $("body").text().trim();

      // --- PASSO 3: RADAR DE TEXTO (BUSCA POR PADRÕES SEM PROTOCOLO) ---
      // Regex focada apenas em identificar a estrutura, sem exigir http/https
      const patterns = [
        /[a-z2-7]{16,56}\.onion/gi, // Onion v2/v3 puro
        /t\.me\/[\w\+]{5,}/gi, // Telegram links/invites
        /https?:\/\/[^\s<"']+/gi, // URLs com protocolo
      ];

      patterns.forEach((regex) => {
        const matches = fullText.match(regex);
        if (matches) matches.forEach((m) => foundLinks.add(m.trim()));
      });

      // --- PASSO 4: PERSISTÊNCIA ---
      const dataToSave = {
        seed: seed,
        texto: fullText, // Mantém a formatação original com quebras de linha
        links: Array.from(foundLinks).join("\n"),
      };

      await db.save(dataToSave);

      console.log(`\n\x1b[32m[COLETA][ID: ${seed}]\x1b[0m`);
      console.log(
        ` > Texto: ${dataToSave.texto.split("\n").length} linhas extraídas.`,
      );
      console.log(` > Links: ${foundLinks.size} capturados.`);
    } catch (err) {
      console.error(`\x1b[31m[ERRO-CRÍTICO]\x1b[0m ${seed}: ${err.message}`);
    }
  });
}

module.exports = { processContent };
