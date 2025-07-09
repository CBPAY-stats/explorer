// Sistema de cache simples para otimizar chamadas à API
class APICache {
  constructor(maxSize = 50, ttl = 5 * 60 * 1000) { // 5 minutos TTL
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  generateKey(url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    return `${url}?${paramString}`
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    // Verificar se expirou
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set(key, data) {
    // Remover itens mais antigos se o cache estiver cheio
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    })
  }

  clear() {
    this.cache.clear()
  }

  has(key) {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

export const apiCache = new APICache()

