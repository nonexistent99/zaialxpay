/**
 * Integração com Marcha Pay - Geração de PIX
 * 
 * Esta classe fornece métodos para integrar com a API da Marcha Pay
 * e gerar transações de PIX de forma simples e segura.
 */

const crypto = require('crypto');

class MarchaPay {
  /**
   * Inicializa a instância de MarchaPay
   * @param {string} publicKey - Chave pública da Marcha Pay
   * @param {string} secretKey - Chave secreta da Marcha Pay
   * @param {boolean} sandbox - Se true, usa ambiente de sandbox
   */
  constructor(publicKey, secretKey, sandbox = false) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
    this.baseUrl = sandbox 
      ? 'https://sandbox-api.marchabb.com/v1'
      : 'https://api.marchabb.com/v1';
  }

  /**
   * Gera o header de autenticação Basic Auth
   * @returns {string} Header Authorization
   */
  _getAuthHeader() {
    const credentials = `${this.publicKey}:${this.secretKey}`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Realiza uma requisição HTTP para a API da Marcha Pay
   * @param {string} method - Método HTTP (GET, POST, PUT, etc)
   * @param {string} endpoint - Endpoint da API (ex: /transactions)
   * @param {object} data - Dados para enviar no corpo da requisição
   * @returns {Promise<object>} Resposta da API
   */
  async _request(method, endpoint, data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Authorization': this._getAuthHeader(),
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
          `Erro na API Marcha Pay: ${response.status} - ${JSON.stringify(responseData)}`
        );
      }

      return responseData;
    } catch (error) {
      console.error('Erro na requisição:', error);
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
   *   amount: 10000,  // R$ 100,00 em centavos
   *   currency: 'BRL',
   *   customer: {
   *     name: 'João Silva',
   *     email: 'joao@example.com',
   *     document: '12345678900',
   *     phone: '11999999999'
   *   },
   *   items: [
   *     {
   *       name: 'Produto 1',
   *       quantity: 1,
   *       price: 10000
   *     }
   *   ],
   *   pix: {
   *     expiresInDays: 1  // PIX expira em 1 dia
   *   }
   * }
   */
  async createPixTransaction(pixData) {
    // Validações básicas
    if (!pixData.amount || pixData.amount <= 0) {
      throw new Error('Amount é obrigatório e deve ser maior que 0');
    }

    if (!pixData.customer || !pixData.customer.name) {
      throw new Error('Dados do cliente são obrigatórios');
    }

    if (!pixData.items || pixData.items.length === 0) {
      throw new Error('Ao menos um item é obrigatório');
    }

    // Normaliza os items para o formato esperado pela Marcha Pay
    const normalizedItems = pixData.items.map(item => ({
      title: item.title || item.name || 'Item',
      unitPrice: item.unitPrice || item.price || 0,
      quantity: item.quantity || 1,
      tangible: item.tangible !== undefined ? item.tangible : false
    }));

    // Normaliza o documento se vier como string
    let document = pixData.customer.document;
    if (typeof document === 'string') {
      document = {
        number: document,
        type: '50958347824' // CPF é tipo 50958347824 na Marcha Pay - v2
      };
    }

    // Prepara os dados da transação
    const payload = {
      amount: pixData.amount,
      currency: pixData.currency || 'BRL',
      paymentMethod: 'pix',
      customer: {
        name: pixData.customer.name,
        email: pixData.customer.email,
        document: document,
        phone: pixData.customer.phone
      },
      items: normalizedItems,
      pix: {
        expiresInDays: pixData.pix?.expiresInDays || 1
      },
      postbackUrl: pixData.postbackUrl || null,
      externalRef: pixData.externalRef || this._generateExternalRef(),
      metadata: pixData.metadata || null
    };

    // Remove campos nulos
    Object.keys(payload).forEach(key => {
      if (payload[key] === null) {
        delete payload[key];
      }
    });

    return await this._request('POST', '/transactions', payload);
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
    return await this._request('GET', `/transactions/${transactionId}`);
  }

  /**
   * Lista todas as transações
   * @param {object} filters - Filtros opcionais (limit, offset, status, etc)
   * @returns {Promise<object>} Lista de transações
   */
  async listTransactions(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/transactions${queryParams ? '?' + queryParams : ''}`;
    return await this._request('GET', endpoint);
  }

  /**
   * Estorna uma transação
   * @param {string} transactionId - ID da transação a estornar
   * @param {object} refundData - Dados do reembolso
   * @returns {Promise<object>} Dados do reembolso
   */
  async refundTransaction(transactionId, refundData = {}) {
    if (!transactionId) {
      throw new Error('Transaction ID é obrigatório');
    }

    const payload = {
      amount: refundData.amount || null,
      reason: refundData.reason || 'Reembolso solicitado'
    };

    return await this._request('POST', `/transactions/${transactionId}/refund`, payload);
  }

  /**
   * Gera uma referência externa única para a transação
   * @returns {string} Referência única
   */
  _generateExternalRef() {
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
   * Formata um valor em centavos para reais
   * @param {number} centavos - Valor em centavos
   * @returns {string} Valor formatado em reais
   */
  static formatCurrency(centavos) {
    return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
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

module.exports = MarchaPay;
