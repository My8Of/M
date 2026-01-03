/**
 * M/3/just_paste/index.js - Operação Arrastão 24/7
 */
const fs = require("fs");
const path = require("path");
const db = require("./db_manager");
const { fetchJPIContent } = require("./miner_jpi");
const { fetchNewSeeds } = require("./dorks_jpi");
const { processContent } = require("./processor");

const SEEDS_FILE = path.join(__dirname, "../../../M/0/seeds.txt");

// Utilitário para converter IDs Base36 (JustPaste) para inteiros e vice-versa
const toBase36 = (n) => n.toString(36);
const fromBase36 = (s) => parseInt(s, 36);

async function start() {
  console.log(
    "\x1b[35m[Maestro]\x1b[0m Iniciando motor perpétuo de mineração...",
  );

  // Setup inicial do banco
  await db.setup();

  while (true) {
    // 1. Verifica se há seeds no .txt
    if (
      !fs.existsSync(SEEDS_FILE) ||
      fs.readFileSync(SEEDS_FILE, "utf8").trim() === ""
    ) {
      console.log(
        "\x1b[33m[Maestro]\x1b[0m Estoque vazio. Rodando dorks.js para minerar novas entradas...",
      );
      await fetchNewSeeds();

      // Pequena pausa para o sistema de arquivos sincronizar
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 2. Lê a lista de seeds
    let seeds = fs
      .readFileSync(SEEDS_FILE, "utf8")
      .split("\n")
      .filter((s) => s.trim());

    if (seeds.length === 0) {
      console.log(
        "\x1b[31m[Maestro]\x1b[0m Falha ao obter novas seeds. Tentando novamente em 5 minutos...",
      );
      await new Promise((r) => setTimeout(r, 300000));
      continue;
    }

    // 3. Pega a primeira seed (FIFO) e atualiza o arquivo
    const currentSeed = seeds.shift();
    fs.writeFileSync(SEEDS_FILE, seeds.join("\n"));

    console.log(
      `\x1b[34m[Maestro]\x1b[0m Iniciando varredura da Seed: ${currentSeed}`,
    );

    // 4. Varredura Máxima: Exploramos todas as combinações do range base (1296 IDs)
    // Isso cobre de 'aa' até 'zz' na base36 para aquele prefixo
    const baseNum = fromBase36(currentSeed);
    const rangeExploracao = 1296;

    for (let i = 0; i < rangeExploracao; i++) {
      const targetId = toBase36(baseNum + i);

      try {
        // Mineração via Tor
        const result = await fetchJPIContent(targetId);

        if (result.success && result.rawHtml) {
          // Envia para o processador assíncrono (Rede de Arrastão)
          processContent(targetId, result.rawHtml);
        } else if (result.status === "BLOCK") {
          console.warn(
            `\x1b[31m[!] Circuito Tor bloqueado.\x1b[0m Renovando IP em 15s...`,
          );
          await new Promise((r) => setTimeout(r, 15000));
        }
      } catch (err) {
        console.error(
          `[Maestro] Erro ao processar ID ${targetId}: ${err.message}`,
        );
      }

      // Delay cirúrgico para não queimar o túnel Tor (500ms - 1s)
      await new Promise((r) => setTimeout(r, 700));
    }

    console.log(
      `\x1b[32m[Maestro]\x1b[0m Varredura da Seed ${currentSeed} finalizada.`,
    );
  }
}

// Tratamento de exceções para garantir que o processo não morra
start().catch((err) => {
  console.error(
    `\x1b[41m[FATAL]\x1b[0m Erro catastrófico no Maestro: ${err.message}`,
  );
  console.log("Reiniciando em 10 segundos...");
  setTimeout(start, 10000);
});
