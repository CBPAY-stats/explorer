// Sistema de rate limiting para evitar sobrecarregar a API
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }

  async canMakeRequest() {
    const now = Date.now()
    
    // Remover requisições antigas da janela de tempo
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    // Verificar se pode fazer nova requisição
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now)
      return true
    }
    
    return false
  }

  async waitForSlot() {
    while (!(await this.canMakeRequest())) {
      // Aguardar um pouco antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  getTimeUntilNextSlot() {
    if (this.requests.length < this.maxRequests) {
      return 0
    }
    
    const oldestRequest = Math.min(...this.requests)
    const timeUntilExpiry = this.windowMs - (Date.now() - oldestRequest)
    return Math.max(0, timeUntilExpiry)
  }
}

export const rateLimiter = new RateLimiter(8, 1000) // 8 requisições por segundo

