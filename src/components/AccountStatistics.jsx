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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', {
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
      return `${diffDays} days`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} ${months === 1 ? 'month' : 'months'}`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} ${years === 1 ? 'year' : 'years'}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.recentActivity} in the last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              Payment operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{formatDate(statistics.lastActivity)}</div>
            <p className="text-xs text-muted-foreground">
              Last transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Age</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAccountAge(statistics.accountAge)}</div>
            <p className="text-xs text-muted-foreground">
              Since creation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balances by Asset */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Balances by Asset
          </CardTitle>
          <CardDescription>
            All assets held in this account
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

      {/* Account Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Signers
            </CardTitle>
            <CardDescription>
              Authorized keys to sign transactions
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
                    Weight: {signer.weight}
                  </Badge>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">
                  No additional signers
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Flags and security settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Sequence Number</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {statistics.sequence}
                </code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Account ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {statistics.accountId?.substring(0, 8)}...
                </code>
              </div>
              {statistics.flags && Object.keys(statistics.flags).length > 0 && (
                <div className="pt-2">
                  <p className="text-sm font-medium mb-1">Active Flags:</p>
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





