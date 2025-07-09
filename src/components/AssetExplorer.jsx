import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Skeleton } from './ui/skeleton'
import { Search, Coins, TrendingUp, Users, ExternalLink } from 'lucide-react'
import { xdbApi } from '../services/xdbApi'

const AssetExplorer = () => {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchCode, setSearchCode] = useState('')
  const [searchIssuer, setSearchIssuer] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState('')

  const loadAssets = async (reset = false) => {
    setLoading(true)
    try {
      const currentCursor = reset ? '' : cursor
      const result = await xdbApi.getAssets(searchCode, searchIssuer, currentCursor, 50)
      
      if (reset) {
        setAssets(result.records)
      } else {
        setAssets(prev => [...prev, ...result.records])
      }
      
      setCursor(result.nextCursor || '')
      setHasMore(result.hasMore)
    } catch (error) {
      console.error('Erro ao carregar ativos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadAssets(true)
  }

  const handleClearSearch = () => {
    setSearchCode('')
    setSearchIssuer('')
    setAssets([])
    setCursor('')
    setHasMore(false)
  }

  useEffect(() => {
    // Carregar ativos iniciais
    loadAssets(true)
  }, [])

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 7
    }).format(parseFloat(amount))
  }

  const formatAddress = (address) => {
    if (!address) return 'N/A'
    return `${address.substring(0, 8)}...${address.substring(-8)}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Explorador de Ativos XDB Chain
          </CardTitle>
          <CardDescription>
            Explore todos os ativos emitidos na rede XDB Chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Código do ativo (ex: USD, EUR, BTC)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Endereço do emissor (opcional)"
                value={searchIssuer}
                onChange={(e) => setSearchIssuer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Pesquisar
              </Button>
              <Button variant="outline" onClick={handleClearSearch}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && assets.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                  </div>
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : assets.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ativos Encontrados ({assets.length})</CardTitle>
            <CardDescription>
              Lista de ativos na rede XDB Chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ativo</TableHead>
                    <TableHead>Emissor</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Contas</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset, index) => (
                    <TableRow key={`${asset.asset_code}-${asset.asset_issuer}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Coins className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{asset.asset_code}</div>
                            <div className="text-sm text-muted-foreground">
                              {asset.asset_type}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {formatAddress(asset.asset_issuer)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatAmount(asset.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {asset.num_claimable_balances > 0 && (
                              <span>+{asset.num_claimable_balances} reivindicáveis</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{asset.num_accounts}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {asset.flags?.auth_required && (
                            <Badge variant="secondary" className="text-xs">
                              Auth Required
                            </Badge>
                          )}
                          {asset.flags?.auth_revocable && (
                            <Badge variant="secondary" className="text-xs">
                              Revocable
                            </Badge>
                          )}
                          {asset.flags?.auth_immutable && (
                            <Badge variant="secondary" className="text-xs">
                              Immutable
                            </Badge>
                          )}
                          {asset.flags?.auth_clawback_enabled && (
                            <Badge variant="destructive" className="text-xs">
                              Clawback
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = `https://horizon.livenet.xdbchain.com/accounts/${asset.asset_issuer}`
                            window.open(url, '_blank')
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {hasMore && (
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => loadAssets(false)}
                  disabled={loading}
                >
                  {loading ? 'Carregando...' : 'Carregar Mais'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum ativo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente pesquisar por um código de ativo específico ou deixe em branco para ver todos os ativos.
            </p>
            <Button onClick={() => loadAssets(true)}>
              Carregar Ativos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AssetExplorer

