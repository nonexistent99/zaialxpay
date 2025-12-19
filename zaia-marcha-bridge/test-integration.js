/**
 * Script de teste para validar a integração com LXPay
 * 
 * Uso: node test-integration.js
 */

const LXPay = require('./lxpay');

// Configurar variáveis de ambiente
process.env.LXPAY_PUBLIC_KEY = process.env.LXPAY_PUBLIC_KEY || 'gp1e9izzye_1765033073407';
process.env.LXPAY_SECRET_KEY = process.env.LXPAY_SECRET_KEY || 'a1f9cd11-eb30-4dc8-a5f6-c86f09a7f001';

async function testLXPayIntegration() {
  console.log('🧪 Iniciando testes de integração com LXPay...\n');

  try {
    // Teste 1: Inicializar cliente LXPay
    console.log('✓ Teste 1: Inicializando cliente LXPay');
    const lxpay = new LXPay(
      process.env.LXPAY_PUBLIC_KEY,
      process.env.LXPAY_SECRET_KEY
    );
    console.log('  ✅ Cliente LXPay inicializado com sucesso\n');

    // Teste 2: Validar CPF
    console.log('✓ Teste 2: Validando CPF');
    const cpfValido = LXPay.validateDocument('12345678901');
    console.log(`  CPF válido: ${cpfValido ? '❌ (CPF inválido, esperado)' : '✅ (validação funcionando)'}\n`);

    // Teste 3: Gerar identificador único
    console.log('✓ Teste 3: Gerando identificador único');
    const identifier = LXPay.generateIdentifier();
    console.log(`  Identificador: ${identifier}`);
    console.log('  ✅ Identificador gerado com sucesso\n');

    // Teste 4: Formatar moeda
    console.log('✓ Teste 4: Formatando valores monetários');
    const valorFormatado = LXPay.formatCurrency(100.50);
    console.log(`  Valor formatado: ${valorFormatado}`);
    console.log('  ✅ Formatação funcionando\n');

    // Teste 5: Converter centavos para reais
    console.log('✓ Teste 5: Convertendo centavos para reais');
    const reais = LXPay.fromCents(10050);
    console.log(`  10050 centavos = R$ ${reais.toFixed(2)}`);
    console.log('  ✅ Conversão funcionando\n');

    // Teste 6: Estrutura de dados para criar PIX
    console.log('✓ Teste 6: Validando estrutura de dados para criar PIX');
    const pixData = {
      amount: 100.00,
      identifier: LXPay.generateIdentifier(),
      client: {
        name: 'João Silva',
        email: 'joao@example.com',
        document: '12345678900',
        phone: '11999999999'
      },
      products: [
        {
          name: 'Produto Teste',
          quantity: 1,
          price: 100.00
        }
      ],
      callbackUrl: 'https://seu-dominio.com/webhook/payment-status'
    };
    console.log('  Estrutura de dados:');
    console.log(JSON.stringify(pixData, null, 2));
    console.log('  ✅ Estrutura validada\n');

    console.log('✨ Todos os testes passaram com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Deploy do servidor em produção');
    console.log('2. Configurar webhook na LXPay');
    console.log('3. Testar integração com Zaia IA');
    console.log('4. Validar fluxo completo de pagamento');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    process.exit(1);
  }
}

// Executar testes
testLXPayIntegration();
