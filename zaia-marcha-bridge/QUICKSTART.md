# 🚀 Guia Rápido - Zaia LXPay Bridge

Comece em 5 minutos!

## 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/nonexistent99/zaiabridge1.git
cd zaiabridge1/zaia-marcha-bridge
```

## 2️⃣ Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas chaves da LXPay:

```env
LXPAY_PUBLIC_KEY=gp1e9izzye_1765033073407
LXPAY_SECRET_KEY=a1f9cd11-eb30-4dc8-a5f6-c86f09a7f001
PORT=3000
NODE_ENV=production
```

## 3️⃣ Instalar Dependências

```bash
npm install
```

## 4️⃣ Testar Localmente

```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

Verifique se está funcionando:
```bash
curl http://localhost:3000/health
```

## 5️⃣ Deploy no EasyPanel

### Opção A: Via Interface Web

1. Acesse o painel do EasyPanel
2. Crie uma nova aplicação Docker
3. Configure o repositório Git
4. Adicione as variáveis de ambiente
5. Clique em Deploy

### Opção B: Via Docker Compose

```bash
docker-compose up -d
```

## 6️⃣ Configurar na Zaia IA

1. Acesse sua conta Zaia IA
2. Vá para seu agente
3. Crie uma ação "Chamada de API"
4. Configure:
   - **URL**: `https://seu-dominio.com/generate-pix`
   - **Método**: POST
   - **Body**:
   ```json
   {
     "amount": {{valor}},
     "identifier": "{{id_unico}}",
     "client": {
       "name": "{{nome}}",
       "email": "{{email}}",
       "document": "{{cpf}}",
       "phone": "{{telefone}}"
     },
     "products": [
       {
         "name": "Produto",
         "quantity": 1,
         "price": {{valor}}
       }
     ]
   }
   ```

## 📋 Checklist

- [ ] Variáveis de ambiente configuradas
- [ ] Servidor rodando localmente
- [ ] Health check retornando OK
- [ ] Deploy realizado
- [ ] Domínio configurado
- [ ] Webhook da LXPay configurado
- [ ] Integração com Zaia testada

## 🔗 Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Verificar status |
| GET | `/` | Informações da API |
| POST | `/generate-pix` | Criar transação PIX |
| GET | `/transaction/:id` | Consultar transação |
| GET | `/balance` | Consultar saldo |
| POST | `/webhook/payment-status` | Receber notificações |

## 🆘 Problemas Comuns

### Erro: "Chaves não configuradas"
- Verifique se o arquivo `.env` está no diretório correto
- Confirme as chaves da LXPay

### Erro: "Porta 3000 já em uso"
- Mude a porta: `PORT=3001 npm start`
- Ou libere a porta: `sudo lsof -i :3000`

### Webhook não recebido
- Verifique a URL de callback no painel da LXPay
- Confirme que é acessível publicamente

## 📚 Documentação Completa

- [README.md](README.md) - Documentação completa
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guia de deployment
- [Documentação LXPay](https://lxpay.com.br/docs)
- [Documentação Zaia](https://zaiadocs.gitbook.io/recursos)

## 💬 Suporte

Dúvidas? Consulte:
1. Os logs: `npm run dev` (modo desenvolvimento)
2. A documentação da LXPay
3. A documentação da Zaia IA
