const express = require('express');
const app = express();
const LXPay = require('./lxpay');

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
});

// Endpoint raiz
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor de ponte Zaia IA - LXPay está rodando',
        endpoints: {
            health: 'GET /health',
            generatePix: 'POST /generate-pix',
            webhook: 'POST /webhook/payment-status'
        }
    });
});

// Endpoint de health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Endpoint para gerar PIX
app.post('/generate-pix', async (req, res) => {
    try {
        const lxpay = new LXPay(
            process.env.LXPAY_PUBLIC_KEY,
            process.env.LXPAY_SECRET_KEY
        );

        const pixData = req.body;
        
        // Validação básica dos dados
        if (!pixData.amount || !pixData.client || !pixData.identifier) {
            return res.status(400).json({
                error: 'Campos obrigatórios faltando: amount, client, identifier'
            });
        }

        const pixTransaction = await lxpay.createPixTransaction(pixData);

        res.json(pixTransaction);
    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        res.status(500).json({
            error: 'Erro interno ao processar a transação PIX.',
            message: error.message
        });
    }
});

// Endpoint para webhook de notificação de pagamento
app.post('/webhook/payment-status', (req, res) => {
    try {
        const webhookData = req.body;
        
        console.log('Webhook recebido:', webhookData);
        
        // Aqui você pode processar a notificação de pagamento
        // Por exemplo: atualizar status no banco de dados, notificar Zaia IA, etc.
        
        res.json({
            status: 'ok',
            message: 'Webhook recebido com sucesso'
        });
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        res.status(500).json({
            error: 'Erro ao processar webhook'
        });
    }
});

// Endpoint para consultar status de uma transação
app.get('/transaction/:transactionId', async (req, res) => {
    try {
        const lxpay = new LXPay(
            process.env.LXPAY_PUBLIC_KEY,
            process.env.LXPAY_SECRET_KEY
        );

        const transaction = await lxpay.getTransaction(req.params.transactionId);
        res.json(transaction);
    } catch (error) {
        console.error('Erro ao consultar transação:', error);
        res.status(500).json({
            error: 'Erro ao consultar transação',
            message: error.message
        });
    }
});

// Endpoint para consultar saldo
app.get('/balance', async (req, res) => {
    try {
        const lxpay = new LXPay(
            process.env.LXPAY_PUBLIC_KEY,
            process.env.LXPAY_SECRET_KEY
        );

        const balance = await lxpay.getBalance();
        res.json(balance);
    } catch (error) {
        console.error('Erro ao consultar saldo:', error);
        res.status(500).json({
            error: 'Erro ao consultar saldo',
            message: error.message
        });
    }
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor de ponte rodando na porta ${PORT}`);
    console.log(
        `Chave pública LXPay: ${
            process.env.LXPAY_PUBLIC_KEY ? 'configurada' : 'NÃO CONFIGURADA'
        }`
    );
    console.log(
        `Chave secreta LXPay: ${
            process.env.LXPAY_SECRET_KEY ? 'configurada' : 'NÃO CONFIGURADA'
        }`
    );
});
