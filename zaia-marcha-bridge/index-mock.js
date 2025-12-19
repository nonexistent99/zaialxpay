const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Endpoint raiz
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor de ponte Zaia IA - Marcha Pay está rodando',
    endpoints: {
      health: 'GET /',
      generatePix: 'POST /generate-pix'
    }
  });
});

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.MARCHA_ENVIRONMENT || 'sandbox',
    hasPublicKey: !!process.env.MARCHA_PUBLIC_KEY,
    hasSecretKey: !!process.env.MARCHA_SECRET_KEY
  });
});

// Endpoint principal - Gerar PIX
app.post('/generate-pix', async (req, res) => {
  try {
    const pixData = req.body;

    console.log('\n📥 Requisição recebida:', JSON.stringify(pixData, null, 2));

    // Validação básica
    if (!pixData.amount || !pixData.customer || !pixData.items) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: 'amount, customer e items são obrigatórios'
      });
    }

    console.log('✅ Dados validados');
    console.log(`📊 Amount: ${pixData.amount}`);
    console.log(`👤 Customer: ${pixData.customer.name}`);

    // Normaliza os items
    const normalizedItems = pixData.items.map(item => ({
      title: item.title || item.name || 'Item',
      unitPrice: item.unitPrice || item.price || 0,
      quantity: item.quantity || 1,
      tangible: item.tangible !== undefined ? item.tangible : false
    }));

    console.log('📦 Items:', normalizedItems);

    // Simula resposta da Marcha Pay com PIX mock
    const mockPixResponse = {
      id: `pix_${Date.now()}`,
      status: 'pending',
      amount: pixData.amount * 100, // em centavos
      currency: 'BRL',
      customer: {
        name: pixData.customer.name,
        email: pixData.customer.email
      },
      pix: {
        qrCode: '00020126580014br.gov.bcb.brcode0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913Fulano de Tal6009SAO PAULO62410503***63041D3D',
        copyAndPaste: '00020126580014br.gov.bcb.brcode0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913Fulano de Tal6009SAO PAULO62410503***63041D3D',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date().toISOString()
    };

    console.log('✅ PIX gerado com sucesso (MOCK)');
    console.log(`🎯 ID: ${mockPixResponse.id}`);

    res.json({
      success: true,
      message: 'PIX gerado com sucesso!',
      data: mockPixResponse
    });

  } catch (error) {
    console.error('❌ Erro ao gerar PIX:', error.message);
    console.error('Stack:', error.stack);

    res.status(500).json({
      error: 'Não foi possível gerar o PIX.',
      details: error.message
    });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nServidor de ponte rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.MARCHA_ENVIRONMENT || 'sandbox'}`);
  console.log(`Chave pública: ${process.env.MARCHA_PUBLIC_KEY ? 'configurada' : 'não configurada'}`);
  console.log(`Chave secreta: ${process.env.MARCHA_SECRET_KEY ? 'configurada' : 'não configurada'}`);
  console.log('\n⚠️  MODO MOCK - Retornando PIX simulado\n');
});
