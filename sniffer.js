const axios = require('axios');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Logger para persistência no arquivo M/4/sniff.log
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'M/4/sniff.log' })
    ]
});

// Padrões de "Ouro" (RegEx)
const patterns = {
    aws: /AKIA[0-9A-Z]{16}/,
    generic_key: /[a-f0-9]{32}/i,
    private_key: /-----BEGIN PRIVATE KEY-----/
};

async function checkPaste(content, sourceUrl) {
    for (const [type, regex] of Object.entries(patterns)) {
        if (regex.test(content)) {
            const id = Date.now();
            const fileName = `M/4/achado_${id}.md`;
            
            const metadata = `---
id: ${id}
tipo: ${type}
fonte: ${sourceUrl}
---
# Conteúdo Extraído
\`\`\`
${content.substring(0, 500)}...
\`\`\`
`;
            fs.writeFileSync(fileName, metadata);
            logger.info(`Ouro encontrado! Tipo: ${type}. Arquivo: ${fileName}`);
        }
    }
}

// Nota: Sites como o Pastebin exigem API Pro para scraping pesado.
// Este é um exemplo de lógica para uma URL de "recentes" (scraping ético/estudo)
async function runSniffer() {
    console.log("Monitorando fluxo de dados...");
    try {
        // Exemplo: buscando em um agregador ou lista de recentes
        // Substitua pela URL da fonte que você encontrar no nível M/3
        const response = await axios.get('URL_DA_FONTE_RECENTES');
        await checkPaste(response.data, 'URL_DA_FONTE');
    } catch (error) {
        logger.error(`Falha na captura: ${error.message}`);
    }
}

// Execução comedida para não estourar os 4GB de RAM
setInterval(runSniffer, 60000); // 1 vez por minuto
