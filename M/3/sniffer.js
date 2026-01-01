const axios = require('axios');
const fs = require('fs');
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'M/0/sniffer.log' }) // Log centralizado em M/0
    ]
});

const patterns = {
    aws: /AKIA[0-9A-Z]{16}/,
    generic_key: /[a-f0-9]{32}/i,
    private_key: /-----BEGIN PRIVATE KEY-----/
};

function getSources() {
    try {
        const data = fs.readFileSync('M/0/.links', 'utf8');
        return data.split('\n')
            .filter(line => line.trim() && !line.startsWith('#'))
            .map(line => {
                const [name, url, layer] = line.split('|');
                return { name, url, layer: parseInt(layer) };
            })
            .filter(src => src.layer === 3); // Apenas Camada 3
    } catch (err) {
        logger.error(`Erro ao carregar fontes: ${err.message}`);
        return [];
    }
}

async function checkPaste(content, sourceName) {
    for (const [type, regex] of Object.entries(patterns)) {
        if (regex.test(content)) {
            const id = Date.now();
            const fileName = `M/4/achado_${id}.md`;
            const metadata = `---\nid: ${id}\ntipo: ${type}\norigem: ${sourceName}\n---\n# Conteúdo\n\`\`\`\n${content.substring(0, 1000)}\n\`\`\``;
            
            fs.writeFileSync(fileName, metadata);
            logger.info(`OURO! [${type}] encontrado via ${sourceName}`);
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
