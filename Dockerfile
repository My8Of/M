# Usamos a versão LTS do Node em Alpine para ser ultra-leve (4GB de RAM agradecem)
FROM node:lts-alpine

# Criamos o diretório de trabalho
WORKDIR /app

# Copiamos apenas o essencial para instalar as dependências (otimiza o cache)
COPY package*.json ./
RUN npm install --production

# Copiamos o resto do código
COPY . .

# Garantimos que os logs e achados persistam na estrutura M
RUN mkdir -p M/0 M/4

# Comando padrão (será sobrescrito pelo compose)
CMD ["node", "M/3/sniffer.js"]
