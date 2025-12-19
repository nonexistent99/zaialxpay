# Usa uma imagem base Node.js
FROM node:20-slim

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia o código da aplicação (agora sem o prefixo, pois o contexto de build é o subdiretório)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta que a aplicação usa
EXPOSE 3000

# Define o comando de inicialização
CMD ["node", "index.js"]
