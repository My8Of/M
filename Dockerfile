FROM node:22-slim

# Instala ferramentas básicas de rede para diagnóstico se necessário
RUN apt-get update && apt-get install -y iputils-ping curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia pacotes primeiro para aproveitar o cache de camadas
COPY package*.json ./
RUN npm install --production

# Copia o restante do código
COPY . .

# Comando para iniciar o maestro
CMD ["node", "M/3/just_paste/index.js"]
