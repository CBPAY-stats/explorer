import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Activity, Wallet, TrendingUp, Clock, Users, Shield } from 'lucide-react'

const AccountStatistics = ({ statistics, loading = false }) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!statistics) {
    return null
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 7
    }).format(balance)
  }

  const getAccountAge = (accountAge) => {
    if (!accountAge) return 'N/A'
    const created = new Date(accountAge)
    const now = new Date()
    const diffTime = Math.abs(now - created)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays} dias`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} ${months === 1 ? 'mês' : 'meses'}`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} ${years === 1 ? 'ano' : 'anos'}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.recentActivity} nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              Operações de pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Atividade</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{formatDate(statistics.lastActivity)}</div>
            <p className="text-xs text-muted-foreground">
              Última transação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idade da Conta</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAccountAge(statistics.accountAge)}</div>
            <p className="text-xs text-muted-foreground">
              Desde a criação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Saldos por ativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldos por Ativo
          </CardTitle>
          <CardDescription>
            Todos os ativos detidos nesta conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(statistics.balances).map(([asset, balance], index) => (
              <div key={asset}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={asset === 'XDB' ? 'default' : 'secondary'}>
                      {asset}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-medium">
                      {formatBalance(balance)}
                    </div>
                  </div>
                </div>
                {index < Object.entries(statistics.balances).length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Informações da conta */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Signatários
            </CardTitle>
            <CardDescription>
              Chaves autorizadas a assinar transações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.signers?.map((signer, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {signer.key?.substring(0, 8)}...{signer.key?.substring(-8)}
                  </code>
                  <Badge variant="outline">
                    Peso: {signer.weight}
                  </Badge>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">
                  Nenhum signatário adicional
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurações da Conta
            </CardTitle>
            <CardDescription>
              Flags e configurações de segurança
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Número de Sequência</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {statistics.sequence}
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>ID da Conta</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {statistics.accountId?.substring(0, 8)}...
                </code>
              </div>
              {statistics.flags && Object.keys(statistics.flags).length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Flags Ativas:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(statistics.flags).map(([flag, value]) => (
                      value && (
                        <Badge key={flag} variant="secondary" className="text-xs">
                          {flag}
                        </Badge>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AccountStatistics

