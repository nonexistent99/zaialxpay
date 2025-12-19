/**
 * Integração com LXPay - Geração de PIX
 * 
 * Esta classe fornece métodos para integrar com a API da LXPay
 * e gerar transações de PIX de forma simples e segura.
 */

const crypto = require('crypto');

class LXPay {
  /**
   * Inicializa a instância de LXPay
   * @param {string} publicKey - Chave pública da LXPay
   * @param {string} secretKey - Chave secreta da LXPay
   */
  constructor(publicKey, secretKey) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
    this.baseUrl = 'https://api.lxpay.com.br';
  }

  /**
   * Realiza uma requisição HTTP para a API da LXPay
   * @param {string} method - Método HTTP (GET, POST, PUT, etc)
   * @param {string} endpoint - Endpoint da API (ex: /api/v1/gateway/pix/receive)
   * @param {object} data - Dados para enviar no corpo da requisição
   * @returns {Promise<object>} Resposta da API
   */
  async _request(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'x-public-key': this.publicKey,
        'x-secret-key': this.secretKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          `Erro na API LXPay: ${response.status} - ${JSON.stringify(responseData)}`
        );
      }

      return responseData;
    } catch (error) {
      console.error('Erro na requisição LXPay:', error);
      throw error;
    }
  }

  /**
   * Cria uma transação de PIX
   * @param {object} pixData - Dados da transação PIX
   * @returns {Promise<object>} Dados da transação criada
   * 
   * Exemplo de pixData:
   * {
   *   amount: 100.00,  // R$ 100,00
   *   client: {
   *     name: 'João Silva',
   *     email: 'joao@example.com',
   *     document: '12345678900',
   *     phone: '11999999999'
   *   },
   *   identifier: 'unique-id-123',
   *   products: [
   *     {
   *       name: 'Produto 1',
   *       quantity: 1,
   *       price: 100.00
   *     }
   *   ],
   *   dueDate: '2024-12-25',
   *   callbackUrl: 'https://seu-dominio.com/webhook',
   *   metadata: {}
   * }
   */
  async createPixTransaction(pixData) {
    // Validações básicas
    if (!pixData.amount || pixData.amount <= 0) {
      throw new Error('Amount é obrigatório e deve ser maior que 0');
    }

    if (!pixData.client || !pixData.client.name) {
      throw new Error('Dados do cliente são obrigatórios');
    }

    if (!pixData.identifier) {
      throw new Error('Identifier é obrigatório');
    }

    // Normaliza os dados do cliente
    const clientData = {
      name: pixData.client.name,
      email: pixData.client.email || '',
      document: pixData.client.document || '',
      phone: pixData.client.phone || ''
    };

    // Prepara os dados da transação
    const payload = {
      amount: pixData.amount,
      client: clientData,
      identifier: pixData.identifier,
      products: pixData.products || [],
      dueDate: pixData.dueDate || null,
      callbackUrl: pixData.callbackUrl || null,
      metadata: pixData.metadata || {}
    };

    // Remove campos nulos
    Object.keys(payload).forEach(key => {
      if (payload[key] === null) {
        delete payload[key];
      }
    });

    return await this._request('POST', '/api/v1/gateway/pix/receive', payload);
  }

  /**
   * Busca uma transação existente
   * @param {string} transactionId - ID da transação
   * @returns {Promise<object>} Dados da transação
   */
  async getTransaction(transactionId) {
    if (!transactionId) {
      throw new Error('Transaction ID é obrigatório');
    }
    return await this._request('GET', `/api/v1/gateway/pix/transactions/${transactionId}`);
  }

  /**
   * Lista todas as transações
   * @param {object} filters - Filtros opcionais (limit, offset, status, etc)
   * @returns {Promise<object>} Lista de transações
   */
  async listTransactions(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/api/v1/gateway/pix/transactions${queryParams ? '?' + queryParams : ''}`;
    return await this._request('GET', endpoint);
  }

  /**
   * Obtém o saldo da conta
   * @returns {Promise<object>} Dados do saldo
   */
  async getBalance() {
    return await this._request('GET', '/api/v1/gateway/balance');
  }

  /**
   * Gera um identificador único para a transação
   * @returns {string} Identificador único
   */
  static generateIdentifier() {
    return `PIX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Valida um CPF/CNPJ
   * @param {string} document - CPF ou CNPJ
   * @returns {boolean} True se válido
   */
  static validateDocument(document) {
    const cleaned = document.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return this._validateCPF(cleaned);
    } else if (cleaned.length === 14) {
      return this._validateCNPJ(cleaned);
    }
    
    return false;
  }

  /**
   * Valida um CPF
   * @param {string} cpf - CPF sem formatação
   * @returns {boolean} True se válido
   */
  static _validateCPF(cpf) {
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }

  /**
   * Valida um CNPJ
   * @param {string} cnpj - CNPJ sem formatação
   * @returns {boolean} True se válido
   */
  static _validateCNPJ(cnpj) {
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    let digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }

  /**
   * Formata um valor em reais
   * @param {number} reais - Valor em reais
   * @returns {string} Valor formatado
   */
  static formatCurrency(reais) {
    return `R$ ${reais.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Converte centavos para reais
   * @param {number} centavos - Valor em centavos
   * @returns {number} Valor em reais
   */
  static fromCents(centavos) {
    return centavos / 100;
  }

  /**
   * Converte reais para centavos
   * @param {number} reais - Valor em reais
   * @returns {number} Valor em centavos
   */
  static toCents(reais) {
    return Math.round(reais * 100);
  }
}

module.exports = LXPay;
