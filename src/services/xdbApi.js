import { apiCache } from '../utils/apiCache.js'
import { rateLimiter } from '../utils/rateLimiter.js'

const HORIZON_API_BASE = 'https://horizon.livenet.xdbchain.com'

class XDBApiService {
  constructor() {
    this.baseUrl = HORIZON_API_BASE
  }

  async makeRequest(url, options = {}) {
    // Verificar cache primeiro
    const cacheKey = apiCache.generateKey(url, options.params || {})
    const cachedData = apiCache.get(cacheKey)
    
    if (cachedData) {
      return cachedData
    }

    // Aguardar slot disponível no rate limiter
    await rateLimiter.waitForSlot()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Armazenar no cache
      apiCache.set(cacheKey, data)
      
      return data
    } catch (error) {
      console.error('Erro na requisição à API:', error)
      throw error
    }
  }

  async getAccountInfo(accountId) {
    try {
      const url = `${this.baseUrl}/accounts/${accountId}`
      const data = await this.makeRequest(url)
      return data
    } catch (error) {
      if (error.message.includes('404')) {
        throw new Error('Conta não encontrada')
      }
      throw new Error('Erro ao buscar informações da conta: ' + error.message)
    }
  }

  async getTransactions(accountId, cursor = '', limit = 200, includeOperations = false) {
    try {
      let url = `${this.baseUrl}/accounts/${accountId}/transactions?order=desc&limit=${limit}&include_failed=false`
      if (cursor) {
        url += `&cursor=${cursor}`
      }

      const data = await this.makeRequest(url)
      
      let transactionsWithOperations = data._embedded?.records || []
      
      // Buscar operações para cada transação em paralelo, mas com limite
      const operationPromises = transactionsWithOperations.map(async (tx) => {
        try {
          const operationsUrl = `${this.baseUrl}/transactions/${tx.hash}/operations`
          const operationsData = await this.makeRequest(operationsUrl)
          const operations = operationsData._embedded?.records || []
          const mainOperationType = operations.length > 0 ? operations[0].type : 'unknown'
          return {
            ...tx,
            operations: operations,
            mainOperationType: mainOperationType
          }
        } catch (error) {
          console.warn(`Erro ao buscar operações para transação ${tx.hash}:`, error)
          return {
            ...tx,
            operations: [],
            mainOperationType: 'unknown'
          }
        }
      })
      
      // Use Promise.allSettled para lidar com falhas parciais
      const results = await Promise.allSettled(operationPromises)
      transactionsWithOperations = results.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      ).filter(tx => tx && typeof tx === 'object')
      
      return {
        records: transactionsWithOperations,
        nextCursor: transactionsWithOperations.length > 0 ? transactionsWithOperations[transactionsWithOperations.length - 1].paging_token : null,
        hasMore: data._links?.next?.href ? true : false,
        totalCount: transactionsWithOperations.length
      }
      
      return {
        records: transactionsWithOperations,
        nextCursor: transactionsWithOperations.length > 0 ? transactionsWithOperations[transactionsWithOperations.length - 1].paging_token : null,
        hasMore: data._links?.next?.href ? true : false,
        totalCount: transactionsWithOperations.length
      }
    } catch (error) {
      throw new Error('Erro ao buscar transações: ' + error.message)
    }
  }

  async getTransactionDetails(transactionHash) {
    try {
      const url = `${this.baseUrl}/transactions/${transactionHash}`
      const txData = await this.makeRequest(url)
      
      // Buscar operações da transação
      try {
        const operationsUrl = `${this.baseUrl}/transactions/${transactionHash}/operations`
        const operationsData = await this.makeRequest(operationsUrl)
        txData.operations = operationsData._embedded?.records || []
        txData.mainOperationType = txData.operations.length > 0 ? txData.operations[0].type : 'unknown'
      } catch (error) {
        console.warn(`Erro ao buscar operações para transação ${transactionHash}:`, error)
        txData.operations = []
        txData.mainOperationType = 'unknown'
      }
      
      return txData
    } catch (error) {
      if (error.message.includes('404')) {
        throw new Error('Transação não encontrada')
      }
      throw new Error('Erro ao buscar detalhes da transação: ' + error.message)
    }
  }

  // Método para buscar múltiplas páginas de transações de forma otimizada
  async getTransactionsBatch(accountId, startCursor = '', maxPages = 2) {
    const results = []
    let cursor = startCursor
    let hasMore = true
    let pagesLoaded = 0

    while (hasMore && pagesLoaded < maxPages) {
      try {
        const result = await this.getTransactions(accountId, cursor, 50) // Always load operations
        
        if (result.records.length === 0) {
          break
        }

        results.push(...result.records)
        cursor = result.nextCursor
        hasMore = result.hasMore
        pagesLoaded++

        // Smaller delay between requests for better UX
        if (hasMore && pagesLoaded < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error(`Erro ao buscar página ${pagesLoaded + 1}:`, error)
        break
      }
    }

    return {
      records: results,
      nextCursor: cursor,
      hasMore: hasMore && pagesLoaded >= maxPages,
      totalFetched: results.length
    }
  }

  // New method for progressive loading
  async getTransactionsProgressive(accountId, cursor = '', limit = 20) {
    try {
      const result = await this.getTransactions(accountId, cursor, limit) // Always load operations
      return result
    } catch (error) {
      throw new Error("Erro ao buscar transações: " + error.message)
    }
  }

  // Method to load operations for a specific transaction on demand
  async getTransactionOperations(transactionHash) {
    try {
      const operationsUrl = `${this.baseUrl}/transactions/${transactionHash}/operations`
      const operationsData = await this.makeRequest(operationsUrl)
      return operationsData._embedded?.records || []
    } catch (error) {
      console.warn(`Erro ao buscar operações para transação ${transactionHash}:`, error)
      return []
    }
  }

  // Método para buscar ofertas de uma conta (se disponível)
  async getAccountOffers(accountId, cursor = '', limit = 200) {
    try {
      let url = `${this.baseUrl}/accounts/${accountId}/offers?order=desc&limit=${limit}`
      if (cursor) {
        url += `&cursor=${cursor}`
      }

      const data = await this.makeRequest(url)
      const records = data._embedded?.records || []
      
      return {
        records,
        nextCursor: records.length > 0 ? records[records.length - 1].paging_token : null,
        hasMore: data._links?.next?.href ? true : false,
        totalCount: records.length
      }
    } catch (error) {
      console.warn('Erro ao buscar ofertas da conta:', error)
      return {
        records: [],
        nextCursor: null,
        hasMore: false,
        totalCount: 0
      }
    }
  }

  // Método para buscar pagamentos de uma conta
  async getAccountPayments(accountId, cursor = '', limit = 200) {
    try {
      let url = `${this.baseUrl}/accounts/${accountId}/payments?order=desc&limit=${limit}`
      if (cursor) {
        url += `&cursor=${cursor}`
      }

      const data = await this.makeRequest(url)
      const records = data._embedded?.records || []
      
      return {
        records,
        nextCursor: records.length > 0 ? records[records.length - 1].paging_token : null,
        hasMore: data._links?.next?.href ? true : false,
        totalCount: records.length
      }
    } catch (error) {
      throw new Error('Erro ao buscar pagamentos: ' + error.message)
    }
  }

  // Método para buscar ativos da rede
  async getAssets(assetCode = '', assetIssuer = '', cursor = '', limit = 200) {
    try {
      let url = `${this.baseUrl}/assets?order=desc&limit=${limit}`
      
      if (assetCode) {
        url += `&asset_code=${assetCode}`
      }
      if (assetIssuer) {
        url += `&asset_issuer=${assetIssuer}`
      }
      if (cursor) {
        url += `&cursor=${cursor}`
      }

      const data = await this.makeRequest(url)
      const records = data._embedded?.records || []
      
      return {
        records,
        nextCursor: records.length > 0 ? records[records.length - 1].paging_token : null,
        hasMore: data._links?.next?.href ? true : false,
        totalCount: records.length
      }
    } catch (error) {
      throw new Error('Erro ao buscar ativos: ' + error.message)
    }
  }

  // Método para buscar operações de uma conta
  async getAccountOperations(accountId, cursor = '', limit = 200, operationType = '') {
    try {
      let url = `${this.baseUrl}/accounts/${accountId}/operations?order=desc&limit=${limit}`
      
      if (cursor) {
        url += `&cursor=${cursor}`
      }
      if (operationType) {
        url += `&type=${operationType}`
      }

      const data = await this.makeRequest(url)
      const records = data._embedded?.records || []
      
      return {
        records,
        nextCursor: records.length > 0 ? records[records.length - 1].paging_token : null,
        hasMore: data._links?.next?.href ? true : false,
        totalCount: records.length
      }
    } catch (error) {
      throw new Error('Erro ao buscar operações: ' + error.message)
    }
  }

  // Método para buscar estatísticas da conta
  async getAccountStatistics(accountId) {
    try {
      const accountInfo = await this.getAccountInfo(accountId)
      const recentTransactions = await this.getTransactions(accountId, '', 50)
      const recentPayments = await this.getAccountPayments(accountId, '', 50)
      
      // Calcular estatísticas
      const totalTransactions = recentTransactions.records.length
      const totalPayments = recentPayments.records.length
      
      // Calcular volume de transações (últimos 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentActivity = recentTransactions.records.filter(tx => 
        new Date(tx.created_at) > thirtyDaysAgo
      )
      
      // Calcular saldos por ativo
      const balancesByAsset = accountInfo.balances.reduce((acc, balance) => {
        const assetKey = balance.asset_type === 'native' ? 'XDB' : 
                        `${balance.asset_code}:${balance.asset_issuer}`
        acc[assetKey] = parseFloat(balance.balance)
        return acc
      }, {})
      
      return {
        accountId: accountInfo.account_id,
        sequence: accountInfo.sequence,
        balances: balancesByAsset,
        totalTransactions,
        totalPayments,
        recentActivity: recentActivity.length,
        signers: accountInfo.signers,
        flags: accountInfo.flags,
        lastActivity: recentTransactions.records[0]?.created_at || null,
        accountAge: accountInfo.last_modified_time
      }
    } catch (error) {
      throw new Error('Erro ao calcular estatísticas da conta: ' + error.message)
    }
  }

  // Método para validar endereço de conta
  validateAccountId(accountId) {
    // Endereços XDB Chain começam com 'G' e têm 56 caracteres
    const accountRegex = /^G[A-Z2-7]{55}$/
    return accountRegex.test(accountId)
  }

  // Método para validar hash de transação
  validateTransactionHash(hash) {
    // Hashes de transação são hexadecimais de 64 caracteres
    const hashRegex = /^[a-fA-F0-9]{64}$/
    return hashRegex.test(hash)
  }

  clearCache() {
    apiCache.clear()
  }
}

export const xdbApi = new XDBApiService()

