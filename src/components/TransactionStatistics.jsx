import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, Activity, DollarSign, Calendar, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format, parseISO, startOfDay, subDays, eachDayOfInterval } from 'date-fns'

const TransactionStatistics = ({ transactions, accountInfo, walletAddress }) => {
  const stats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalTransactions: 0,
        totalSent: 0,
        totalReceived: 0,
        averageAmount: 0,
        transactionTypes: [],
        dailyActivity: [],
        monthlyTrends: [],
        assetDistribution: []
      }
    }

    let totalSent = 0
    let totalReceived = 0
    let transactionCounts = {}
    let assetCounts = {}
    let dailyData = {}

    // Process each transaction
    transactions.forEach(transaction => {
      const operations = transaction.operations || []
      const date = format(parseISO(transaction.created_at), 'yyyy-MM-dd')
      
      // Initialize daily data
      if (!dailyData[date]) {
        dailyData[date] = { date, count: 0, sent: 0, received: 0 }
      }
      dailyData[date].count++

      operations.forEach(operation => {
        const type = operation.type || 'unknown'
        transactionCounts[type] = (transactionCounts[type] || 0) + 1

        // Track amounts for payments
        if (operation.type === 'payment') {
          const amount = parseFloat(operation.amount || 0)
          const asset = operation.asset_type === 'native' ? 'XDB' : (operation.asset_code || 'Unknown')
          
          assetCounts[asset] = (assetCounts[asset] || 0) + amount

          // Determine if sent or received
          if (operation.from === walletAddress) {
            totalSent += amount
            dailyData[date].sent += amount
          } else if (operation.to === walletAddress) {
            totalReceived += amount
            dailyData[date].received += amount
          }
        }

        // Track account creation amounts
        if (operation.type === 'create_account') {
          const amount = parseFloat(operation.starting_balance || 0)
          if (operation.account === walletAddress) {
            totalReceived += amount
            dailyData[date].received += amount
          }
        }
      })
    })

    // Convert to arrays for charts
    const transactionTypes = Object.entries(transactionCounts)
      .map(([type, count]) => ({
        type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
        percentage: ((count / transactions.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)

    const assetDistribution = Object.entries(assetCounts)
      .map(([asset, amount]) => ({
        asset,
        amount: parseFloat(amount.toFixed(7)),
        percentage: ((amount / (totalSent + totalReceived)) * 100).toFixed(1)
      }))
      .sort((a, b) => b.amount - a.amount)

    // Generate daily activity for last 30 days
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    })

    const dailyActivity = last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const data = dailyData[dateStr] || { date: dateStr, count: 0, sent: 0, received: 0 }
      return {
        ...data,
        displayDate: format(date, 'MMM dd')
      }
    })

    return {
      totalTransactions: transactions.length,
      totalSent: parseFloat(totalSent.toFixed(7)),
      totalReceived: parseFloat(totalReceived.toFixed(7)),
      averageAmount: parseFloat(((totalSent + totalReceived) / transactions.length).toFixed(7)),
      transactionTypes,
      dailyActivity,
      assetDistribution,
      netFlow: parseFloat((totalReceived - totalSent).toFixed(7))
    }
  }, [transactions, walletAddress])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transaction Statistics
          </CardTitle>
          <CardDescription>No transaction data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Load transaction data to view statistics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold text-red-500">{stats.totalSent} XDB</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold text-green-500">{stats.totalReceived} XDB</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Flow</p>
                <p className={`text-2xl font-bold ${stats.netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.netFlow >= 0 ? '+' : ''}{stats.netFlow} XDB
                </p>
              </div>
              {stats.netFlow >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
            <CardDescription>Transaction count and volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value, name) => [
                    name === 'count' ? value : `${value} XDB`,
                    name === 'count' ? 'Transactions' : name === 'sent' ? 'Sent' : 'Received'
                  ]}
                />
                <Area type="monotone" dataKey="count" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Types Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
            <CardDescription>Distribution of transaction types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.transactionTypes.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.transactionTypes.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Volume</CardTitle>
            <CardDescription>Sent vs Received amounts over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value, name) => [`${value} XDB`, name === 'sent' ? 'Sent' : 'Received']}
                />
                <Bar dataKey="sent" fill="#ef4444" />
                <Bar dataKey="received" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
            <CardDescription>Volume by asset type</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.assetDistribution.length > 0 ? (
              <div className="space-y-4">
                {stats.assetDistribution.slice(0, 5).map((asset, index) => (
                  <div key={asset.asset} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{asset.asset}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{asset.amount}</p>
                      <p className="text-sm text-muted-foreground">{asset.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No asset data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Type Breakdown</CardTitle>
          <CardDescription>Detailed breakdown of all transaction types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.transactionTypes.map((type, index) => (
              <div key={type.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{type.type}</span>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{type.count}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{type.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionStatistics

