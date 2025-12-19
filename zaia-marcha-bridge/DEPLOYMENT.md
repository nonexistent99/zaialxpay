# Guia de Deployment - Zaia LXPay Bridge

Este documento descreve como fazer o deploy da aplicação Zaia LXPay Bridge em diferentes plataformas.

## 📋 Pré-requisitos

- Node.js 18+
- Docker (para deploy em container)
- Chaves de API da LXPay (public_key e secret_key)
- URL pública para webhooks

## 🚀 Deployment no EasyPanel

### Passo 1: Preparar o Repositório

1. Faça um fork ou clone do repositório
2. Certifique-se de que o arquivo `.env` está no `.gitignore`
3. Commit e push para seu repositório

### Passo 2: Criar Aplicação no EasyPanel

1. Acesse o painel do EasyPanel
2. Clique em "Criar Nova Aplicação"
3. Selecione "Docker" como tipo de aplicação
4. Configure o repositório Git:
   - URL do repositório
   - Branch: `main`
   - Dockerfile path: `zaia-marcha-bridge/Dockerfile`

### Passo 3: Configurar Variáveis de Ambiente

No painel do EasyPanel, adicione as seguintes variáveis de ambiente:

```
LXPAY_PUBLIC_KEY=gp1e9izzye_1765033073407
LXPAY_SECRET_KEY=a1f9cd11-eb30-4dc8-a5f6-c86f09a7f001
PORT=3000
NODE_ENV=production
CALLBACK_URL=https://seu-dominio.com/webhook/payment-status
```

### Passo 4: Configurar Porta

- Porta interna: `3000`
- Porta externa: `80` ou `443` (com SSL)

### Passo 5: Configurar Domínio

1. Adicione um domínio personalizado ou use o domínio fornecido pelo EasyPanel
2. Configure SSL/TLS (recomendado)
3. Anote a URL pública (ex: `https://seu-dominio.com`)

### Passo 6: Deploy

1. Clique em "Deploy"
2. Aguarde a construção da imagem Docker
3. Verifique os logs para erros
4. Teste o health check: `https://seu-dominio.com/health`

## 🐳 Deployment com Docker Compose (Local)

### Passo 1: Preparar Arquivo .env

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```
LXPAY_PUBLIC_KEY=sua_chave_publica
LXPAY_SECRET_KEY=sua_chave_secreta
CALLBACK_URL=http://localhost:3000/webhook/payment-status
```

### Passo 2: Executar Docker Compose

```bash
docker-compose up -d
```

### Passo 3: Verificar Status

```bash
docker-compose ps
docker-compose logs -f
```

### Passo 4: Testar

```bash
curl http://localhost:3000/health
```

## 🖥️ Deployment Manual (VPS/Servidor)

### Passo 1: Conectar ao Servidor

```bash
ssh usuario@seu-servidor.com
```

### Passo 2: Clonar Repositório

```bash
cd /home/usuario
git clone https://github.com/seu-usuario/zaiabridge1.git
cd zaiabridge1/zaia-marcha-bridge
```

### Passo 3: Instalar Dependências

```bash
npm install --production
```

### Passo 4: Configurar Variáveis de Ambiente

```bash
cp .env.example .env
nano .env
```

Adicione suas credenciais da LXPay.

### Passo 5: Instalar PM2 (Gerenciador de Processos)

```bash
npm install -g pm2
```

### Passo 6: Iniciar Aplicação com PM2

```bash
pm2 start index.js --name "zaia-lxpay-bridge"
pm2 save
pm2 startup
```

### Passo 7: Configurar Nginx (Reverse Proxy)

Crie um arquivo de configuração Nginx:

```bash
sudo nano /etc/nginx/sites-available/zaia-lxpay-bridge
```

Adicione:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site:

```bash
sudo ln -s /etc/nginx/sites-available/zaia-lxpay-bridge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Passo 8: Configurar SSL com Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## 🔍 Verificação Pós-Deployment

### 1. Health Check

```bash
curl https://seu-dominio.com/health
```

Resposta esperada:
```json
{"status":"ok"}
```

### 2. Verificar Configuração

```bash
curl https://seu-dominio.com/
```

Resposta esperada:
```json
{
  "status": "ok",
  "message": "Servidor de ponte Zaia IA - LXPay está rodando",
  "endpoints": {
    "health": "GET /health",
    "generatePix": "POST /generate-pix",
    "webhook": "POST /webhook/payment-status"
  }
}
```

### 3. Verificar Logs

**EasyPanel:**
```
Acesse o painel → Aplicação → Logs
```

**PM2:**
```bash
pm2 logs zaia-lxpay-bridge
```

**Docker:**
```bash
docker-compose logs -f zaia-lxpay-bridge
```

## 🔧 Troubleshooting

### Erro: "Chaves não configuradas"

**Solução:** Verifique se as variáveis de ambiente estão definidas corretamente:

```bash
echo $LXPAY_PUBLIC_KEY
echo $LXPAY_SECRET_KEY
```

### Erro: "Porta 3000 já em uso"

**Solução:** Mude a porta na variável `PORT` ou libere a porta:

```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Erro: "Conexão recusada com LXPay"

**Solução:** Verifique se:
1. As chaves estão corretas
2. A URL da API está acessível
3. Não há firewall bloqueando a conexão

### Erro: "Webhook não recebido"

**Solução:** 
1. Verifique se a URL de callback está correta
2. Configure a URL do webhook no painel da LXPay
3. Verifique os logs da aplicação

## 📊 Monitoramento

### Configurar Alertas no EasyPanel

1. Acesse Configurações → Alertas
2. Configure notificações para:
   - Falha de deployment
   - Uso alto de CPU/Memória
   - Reinicializações frequentes

### Verificar Métricas

```bash
# Com PM2
pm2 monit

# Com Docker
docker stats zaia-marcha-bridge-zaia-lxpay-bridge-1
```

## 🔐 Segurança

### Recomendações

1. **Use HTTPS/SSL** em produção
2. **Mantenha as chaves seguras** - nunca as exponha em logs
3. **Configure CORS** apropriadamente
4. **Implemente rate limiting** para proteger contra abuso
5. **Monitore os logs** regularmente
6. **Faça backups** das configurações

### Variáveis Sensíveis

Nunca commite o arquivo `.env` no repositório. Use:

```bash
echo ".env" >> .gitignore
git rm --cached .env
git commit -m "Remove .env from tracking"
```

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique os logs da aplicação
2. Consulte a documentação da LXPay
3. Entre em contato com o suporte
