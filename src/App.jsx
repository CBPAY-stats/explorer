import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Loader2, Search, ExternalLink, Copy, CheckCircle, AlertCircle, Wallet, TrendingUp, Clock, Hash, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, ArrowRight, Coins, Activity, Filter, Download, Star, BarChart3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { xdbApi } from './services/xdbApi.js'
import { useDebounce } from './hooks/useDebounce.js'
import TransactionFilters from './components/TransactionFilters.jsx'
import ExportData from './components/ExportData.jsx'
import FavoriteAddresses from './components/FavoriteAddresses.jsx'
import TransactionStatistics from './components/TransactionStatistics.jsx'
import AccountStatistics from './components/AccountStatistics.jsx'
import AssetExplorer from './components/AssetExplorer.jsx'
import LoadMoreButton from './components/LoadMoreButton.jsx'
import { format, parseISO } from 'date-fns'
import './App.css'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [allTransactions, setAllTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountInfo, setAccountInfo] = useState(null)
  const [copiedHash, setCopiedHash] = useState('')
  
  // New state for hash search
  const [searchType, setSearchType] = useState('wallet') // 'wallet' or 'transaction'
  const [transactionDetails, setTransactionDetails] = useState(null)
  const [accountStatistics, setAccountStatistics] = useState(null)
  const [loadingStatistics, setLoadingStatistics] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Cache and background loading
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState('')
  const [hasMoreData, setHasMoreData] = useState(false)
  
  // New state for filters
  const [filters, setFilters] = useState({
    type: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: ''
  })
  
  // Debounce for search
  const debouncedWalletAddress = useDebounce(walletAddress, 500)

  // Auto-validation of address
  const isValidAddress = (address) => {
    return address && address.length === 56 && address.match(/^G[A-Z2-7]{55}$/)
  }

  // Transaction hash validation
  const isValidTransactionHash = (hash) => {
    return hash && hash.length === 64 && hash.match(/^[a-fA-F0-9]{64}$/)
  }

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    if (!allTransactions || allTransactions.length === 0) return []

    return allTransactions.filter(transaction => {
      // Type filter
      if (filters.type && filters.type !== 'all') {
        const mainOperationType = transaction.mainOperationType || 'unknown'
        if (mainOperationType !== filters.type) return false
      }

      // Date filters
      if (filters.dateFrom) {
        const transactionDate = parseISO(transaction.created_at)
        const fromDate = parseISO(filters.dateFrom)
        if (transactionDate < fromDate) return false
      }

      if (filters.dateTo) {
        const transactionDate = parseISO(transaction.created_at)
        const toDate = parseISO(filters.dateTo + 'T23:59:59')
        if (transactionDate > toDate) return false
      }

      // Amount filters
      if (filters.minAmount || filters.maxAmount) {
        const operations = transaction.operations || []
        let transactionAmount = 0

        // Get transaction amount
        for (const op of operations) {
          if (op.amount) {
            transactionAmount = parseFloat(op.amount)
            break
          }
          if (op.starting_balance) {
            transactionAmount = parseFloat(op.starting_balance)
            break
          }
        }

        if (filters.minAmount && transactionAmount < parseFloat(filters.minAmount)) return false
        if (filters.maxAmount && transactionAmount > parseFloat(filters.maxAmount)) return false
      }

      return true
    })
  }, [allTransactions, filters])

  // Paginated transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }, [filteredTransactions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)

  const loadInitialData = async (accountId) => {
    try {
      // Fetch account info and initial transactions in parallel
      const [accountData, transactionsResult] = await Promise.all([
        xdbApi.getAccountInfo(accountId),
        xdbApi.getTransactionsProgressive(accountId, '', 20) // Load only first 20 transactions initially
      ])

      setAccountInfo(accountData)
      setAllTransactions(transactionsResult.records)
      setNextCursor(transactionsResult.nextCursor)
      setHasMoreData(transactionsResult.hasMore)

      // Load account statistics in background
      setLoadingStatistics(true)
      try {
        const statistics = await xdbApi.getAccountStatistics(accountId)
        setAccountStatistics(statistics)
      } catch (error) {
        console.error('Error loading account statistics:', error)
      } finally {
        setLoadingStatistics(false)
      }

      return transactionsResult
    } catch (error) {
      throw error
    }
  }

  const loadMoreTransactionsInBackground = async (accountId, cursor) => {
    if (!cursor || loadingMore) return

    try {
      setLoadingMore(true)
      const result = await xdbApi.getTransactionsProgressive(accountId, cursor, 20) // Load 20 more transactions
      
      if (result.records.length > 0) {
        setAllTransactions(prev => [...prev, ...result.records])
        setNextCursor(result.nextCursor)
        setHasMoreData(result.hasMore)
      }
    } catch (error) {
      console.error('Error loading more transactions:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // New function to manually load more transactions
  const loadMoreTransactions = async () => {
    if (!nextCursor || loadingMore || !walletAddress) return
    await loadMoreTransactionsInBackground(walletAddress, nextCursor)
  }

  const handleSearch = async (addressToSearch = walletAddress) => {
    if (!addressToSearch.trim()) {
      setError('Please enter a valid wallet address or transaction hash')
      return
    }

    // Determine search type based on input
    const trimmedInput = addressToSearch.trim()
    const isWallet = isValidAddress(trimmedInput)
    const isTransaction = isValidTransactionHash(trimmedInput)

    if (!isWallet && !isTransaction) {
      setError('Invalid format. Enter a wallet address (56 characters, starting with "G") or transaction hash (64 hexadecimal characters).')
      return
    }

    setLoading(true)
    setError('')
    setAccountInfo(null)
    setAllTransactions([])
    setTransactionDetails(null)
    setAccountStatistics(null)
    setCurrentPage(1)

    try {
      if (isWallet) {
        setSearchType('wallet')
        setWalletAddress(trimmedInput)
        await loadInitialData(trimmedInput)
      } else if (isTransaction) {
        setSearchType('transaction')
        const transactionData = await xdbApi.getTransactionDetails(trimmedInput)
        setTransactionDetails(transactionData)
      }
    } catch (error) {
      console.error('Search error:', error)
      if (error.message.includes('404')) {
        setError(isWallet ? 'Wallet address not found or has no transactions' : 'Transaction not found')
      } else {
        setError('Error fetching data. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddressClick = (address) => {
    setWalletAddress(address)
    handleSearch(address)
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: ''
    })
    setCurrentPage(1)
  }

  // Auto-search when debounced address changes
  useEffect(() => {
    if (debouncedWalletAddress && isValidAddress(debouncedWalletAddress)) {
      handleSearch(debouncedWalletAddress)
    }
  }, [debouncedWalletAddress])

  // Background loading of more transactions
  useEffect(() => {
    if (accountInfo && nextCursor && hasMoreData && !loadingMore) {
      const timer = setTimeout(() => {
        loadMoreTransactionsInBackground(walletAddress, nextCursor)
      }, 2000) // Load more after 2 seconds

      return () => clearTimeout(timer)
    }
  }, [accountInfo, nextCursor, hasMoreData, loadingMore, walletAddress])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    setTimeout(() => setCopiedHash(''), 2000)
  }

  const getOperationDetails = (transaction) => {
    const operations = transaction.operations || []
    const mainOperationType = transaction.mainOperationType || 'unknown'
    
    if (operations.length === 0) {
      // If operations not loaded yet, show basic info from transaction
      return { 
        type: mainOperationType === 'unknown' ? 'Transaction' : mainOperationType, 
        from: transaction.source_account || '', 
        to: '', 
        amount: '', 
        asset: 'XDB',
        operationCount: transaction.operation_count || 1,
        needsOperations: true
      }
    }

    const mainOperation = operations[0]
    let type = 'Other'
    let from = ''
    let to = ''
    let amount = ''
    let asset = 'XDB'

    switch (mainOperation.type) {
      case 'payment':
        type = mainOperation.to === walletAddress ? 'Received' : 'Payment'
        from = mainOperation.from
        to = mainOperation.to
        amount = mainOperation.amount
        asset = mainOperation.asset_type === 'native' ? 'XDB' : mainOperation.asset_code
        break
      case 'create_account':
        type = 'Account Creation'
        from = mainOperation.source_account || transaction.source_account
        to = mainOperation.account
        amount = mainOperation.starting_balance
        break
      case 'change_trust':
        type = 'Trust Change'
        from = mainOperation.trustor
        asset = mainOperation.asset_code
        break
      case 'allow_trust':
        type = 'Allow Trust'
        from = mainOperation.trustee
        to = mainOperation.trustor
        asset = mainOperation.asset_code
        break
      case 'manage_sell_offer':
        type = 'Sell Offer'
        amount = mainOperation.amount
        asset = mainOperation.selling_asset_type === 'native' ? 'XDB' : mainOperation.selling_asset_code
        break
      case 'manage_buy_offer':
        type = 'Buy Offer'
        amount = mainOperation.amount
        asset = mainOperation.buying_asset_type === 'native' ? 'XDB' : mainOperation.buying_asset_code
        break
      case 'set_options':
        type = "Set Options"
        break
      case 'merge_account':        type = "Account Merge"
        from = transaction.source_account
        to = mainOperation.destination
        break
      case 'bump_sequence':
        type = "Bump Sequence"
        break
      case 'path_payment_strict_receive':
        type = 'Path Payment (Receive)'
        from = mainOperation.from
        to = mainOperation.to
        amount = mainOperation.destination_amount
        asset = mainOperation.destination_asset_type === 'native' ? 'XDB' : mainOperation.destination_asset_code
        break
      case 'path_payment_strict_send':
        type = 'Path Payment (Send)'
        from = mainOperation.from
        to = mainOperation.to
        amount = mainOperation.source_amount
        asset = mainOperation.source_asset_type === 'native' ? 'XDB' : mainOperation.source_asset_code
        break
      default:
        type = mainOperationType || 'Other'
    }

    return { type, from, to, amount, asset, operationCount: operations.length, needsOperations: false }
  }

  const formatAmount = (amount) => {
    if (!amount) return ''
    const num = parseFloat(amount)
    return num.toFixed(7).replace(/\.?0+$/, '')
  }

  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'MM/dd/yyyy, HH:mm:ss')
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium px-3">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(parseInt(value))
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              XDB Chain Explorer
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore wallets and transactions on the XDB Chain. Enter a wallet address or transaction hash to get started.
          </p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search
              </CardTitle>
              <CardDescription>
                Enter a wallet address (56 characters, starting with "G") or transaction hash (64 hexadecimal characters)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="e.g., GABCASXIBIQB5PHRXIN5R7FW3DPF3KRDCD2G5KE4VHRZ..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-10"
                  />
                  {walletAddress && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isValidAddress(walletAddress) ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : isValidTransactionHash(walletAddress) ? (
                        <Hash className="h-5 w-5 text-blue-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <Button onClick={() => handleSearch()} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {walletAddress && (
                <div className="text-sm">
                  {isValidAddress(walletAddress) && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Valid wallet address
                    </div>
                  )}
                  {isValidTransactionHash(walletAddress) && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Hash className="h-4 w-4" />
                      Valid transaction hash
                    </div>
                  )}
                  {!isValidAddress(walletAddress) && !isValidTransactionHash(walletAddress) && walletAddress.length > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      Invalid format
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Favorites Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FavoriteAddresses 
            currentAddress={walletAddress}
            onAddressSelect={handleAddressClick}
          />
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {(accountInfo || transactionDetails) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Account Information */}
              {accountInfo && searchType === 'wallet' && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="assets">Assets</TabsTrigger>
                        <TabsTrigger value="statistics">Statistics</TabsTrigger>
                        <TabsTrigger value="explorer">Asset Explorer</TabsTrigger>
                        <TabsTrigger value="export">Export</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">XDB Balance</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {accountInfo.balances?.find(b => b.asset_type === 'native')?.balance || '0.0000000'} XDB
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Sequence</p>
                            <p className="text-2xl font-bold text-green-600">{accountInfo.sequence}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Transactions Loaded</p>
                            <p className="text-2xl font-bold text-purple-600">{allTransactions.length}</p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="assets" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {accountInfo.balances?.map((balance, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Coins className="h-5 w-5" />
                                <h3 className="font-semibold">
                                  {balance.asset_type === 'native' ? 'XDB' : balance.asset_code}
                                </h3>
                              </div>
                              <p className="text-2xl font-bold mb-2">
                                {parseFloat(balance.balance).toFixed(7)} {balance.asset_type === 'native' ? 'XDB' : balance.asset_code}
                              </p>
                              {balance.asset_type !== 'native' && (
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>Issuer: {balance.asset_issuer?.slice(0, 12)}...</p>
                                  <p>Limit: {balance.limit === '922337203685.4775807' ? 'No limit' : balance.limit}</p>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="statistics">
                        <AccountStatistics 
                          statistics={accountStatistics}
                          loading={loadingStatistics}
                        />
                      </TabsContent>
                      
                      <TabsContent value="explorer">
                        <AssetExplorer />
                      </TabsContent>
                      
                      <TabsContent value="export">
                        <ExportData 
                          transactions={filteredTransactions}
                          accountInfo={accountInfo}
                          walletAddress={walletAddress}
                        />
                      </TabsContent>
                      
                      <TabsContent value="statistics_old">
                        <TransactionStatistics 
                          transactions={allTransactions}
                          accountInfo={accountInfo}
                          walletAddress={walletAddress}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Filters */}
              {allTransactions.length > 0 && (
                <TransactionFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  transactionCount={filteredTransactions.length}
                />
              )}

              {/* Transaction History */}
              {allTransactions.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Transaction History
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {filteredTransactions.length} transactions loaded
                        </span>
                        {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {paginatedTransactions.map((transaction, index) => {
                        const details = getOperationDetails(transaction)
                        return (
                          <motion.div
                            key={transaction.hash}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={details.type === 'Received' ? 'default' : details.type === 'Payment' ? 'destructive' : (details.type.includes('Buy') || details.type.includes('Sell')) ? 'secondary' : 'secondary'}
                                  className="text-xs">
                                  {details.type}
                                </Badge>
                                <span className="text-sm font-mono text-muted-foreground">
                                  #{transaction.hash.slice(0, 8)}...{transaction.hash.slice(-8)}
                                </span>
                                {details.operationCount > 1 && (
                                  <Badge variant="outline" className="text-xs">
                                    {details.operationCount} ops
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(transaction.created_at)}
                              </span>
                            </div>

                            {details.amount && (
                              <div className="mb-2">
                                <span className="text-lg font-semibold">
                                  {formatAmount(details.amount)} {details.asset}
                                </span>
                              </div>
                            )}

                            <div className="space-y-1 mb-3">
                                {details.from && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">From:</span>
                                    <button
                                      onClick={() => handleAddressClick(details.from)}
                                      className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {details.from.slice(0, 12)}...{details.from.slice(-8)}
                                    </button>
                                  </div>
                                )}
                                {details.to && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">To:</span>
                                    <button
                                      onClick={() => handleAddressClick(details.to)}
                                      className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {details.to.slice(0, 12)}...{details.to.slice(-8)}
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Operations: {details.operationCount} | Fee: {(transaction.fee_charged / 10000000).toFixed(7)} XDB</span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSearchType("transaction")
                                      setTransactionDetails(transaction)
                                    }}
                                  >
                                    <Activity className="h-4 w-4 mr-1" /> Details
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(`https://explorer.xdbchain.com/transaction/${transaction.hash}`, 
                                      "_blank")}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" /> Explorer
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                        )
                      })}
                    </div>

                    {renderPagination()}
                    
                    {/* Load More Button */}
                    <LoadMoreButton
                      onLoadMore={loadMoreTransactions}
                      loading={loadingMore}
                      hasMore={hasMoreData}
                      totalLoaded={allTransactions.length}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Transaction Details (for hash search) */}
              {transactionDetails && searchType === 'transaction' && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      Transaction Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Hash</p>
                        <p className="font-mono text-sm break-all">{transactionDetails.hash}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Date</p>
                        <p className="text-sm">{formatDate(transactionDetails.created_at)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Source Account</p>
                        <button
                          onClick={() => handleAddressClick(transactionDetails.source_account)}
                          className="font-mono text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          {transactionDetails.source_account}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Fee</p>
                        <p className="text-sm">{(transactionDetails.fee_charged / 10000000).toFixed(7)} XDB</p>
                      </div>
                    </div>

                    {transactionDetails.operations && transactionDetails.operations.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold">Operations ({transactionDetails.operations.length})</h3>
                        {transactionDetails.operations.map((operation, index) => {
                          const opDetails = getOperationDetails({ operations: [operation] })
                          return (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{opDetails.type}</Badge>
                                <span className="text-sm text-muted-foreground">Operation {index + 1}</span>
                              </div>
                              {opDetails.amount && (
                                <p className="text-sm mb-1">
                                  <span className="font-medium">Amount:</span> {formatAmount(opDetails.amount)} {opDetails.asset}
                                </p>
                              )}
                              {opDetails.from && (
                                <p className="text-sm mb-1">
                                  <span className="font-medium">From:</span>{' '}
                                  <button
                                    onClick={() => handleAddressClick(opDetails.from)}
                                    className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {opDetails.from}
                                  </button>
                                </p>
                              )}
                              {opDetails.to && (
                                <p className="text-sm">
                                  <span className="font-medium">To:</span>{' '}
                                  <button
                                    onClick={() => handleAddressClick(opDetails.to)}
                                    className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {opDetails.to}
                                  </button>
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-8">
          Built for exploring the XDB Chain • Data provided by Horizon API
        </div>
      </div>
    </div>
  )
}

export default App



