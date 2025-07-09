import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Loader2, Search, ExternalLink, Copy, CheckCircle, AlertCircle, Wallet, TrendingUp, Clock, Hash, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, ArrowRight, Coins, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { xdbApi } from './services/xdbApi.js'
import { useDebounce } from './hooks/useDebounce.js'
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  // Cache and background loading
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState('')
  const [hasMoreData, setHasMoreData] = useState(false)
  
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

  const loadInitialData = async (accountId) => {
    try {
      // Fetch account info and transactions in parallel
      const [accountData, transactionsResult] = await Promise.all([
        xdbApi.getAccountInfo(accountId),
        xdbApi.getTransactionsBatch(accountId) // Load all transactions
      ])

      setAccountInfo(accountData)
      setAllTransactions(transactionsResult.records)
      setNextCursor(transactionsResult.nextCursor)
      setHasMoreData(transactionsResult.hasMore)

      return transactionsResult
    } catch (error) {
      throw error
    }
  }

  const loadMoreTransactionsInBackground = async (accountId, cursor) => {
    if (!cursor || loadingMore) return

    try {
      setLoadingMore(true)
      const result = await xdbApi.getTransactionsBatch(accountId, cursor) // Load all transactions
      
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

    setWalletAddress(addressToSearch)
    setLoading(true)
    setError('')
    setAllTransactions([])
    setAccountInfo(null)
    setTransactionDetails(null)
    setCurrentPage(1)
    setNextCursor('')
    setHasMoreData(false)

    try {
      if (isWallet) {
        setSearchType('wallet')
        const result = await loadInitialData(trimmedInput)
        
        // Load more transactions in background if available
        if (result.hasMore) {
          setTimeout(() => {
            loadMoreTransactionsInBackground(trimmedInput, result.nextCursor)
          }, 1000)
        }
      } else if (isTransaction) {
        setSearchType('transaction')
        const txDetails = await xdbApi.getTransactionDetails(trimmedInput)
        setTransactionDetails(txDetails)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!walletAddress.trim()) return

    // Clear cache before updating
    xdbApi.clearCache()
    await handleSearch()
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedHash(text)
      setTimeout(() => setCopiedHash(''), 2000)
    } catch (err) {
      console.error('Error copying:', err)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatXDB = (amount) => {
    return (parseFloat(amount) / 10000000).toFixed(7) + ' XDB'
  }

  const formatAssetAmount = (amount, assetCode = 'XDB') => {
    if (assetCode === 'XDB' || !assetCode) {
      return formatXDB(amount)
    }
    return `${parseFloat(amount).toFixed(7)} ${assetCode}`
  }

  const getTransactionTypeColor = (successful) => {
    return successful ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  // Enhanced function to process all operations in a transaction
  const getAllOperationDetails = (transaction, accountId) => {
    if (!transaction.operations || transaction.operations.length === 0) {
      return [{ type: 'Generic Transaction', from: null, to: null, amount: null, tag: <Badge className="bg-gray-400 text-white">Generic</Badge>, asset: 'XDB' }]
    }

    return transaction.operations.map((operation, index) => {
      const type = operation.type
      let from = null
      let to = null
      let amount = null
      let tag = null
      let asset = 'XDB'

      switch (type) {
        case 'payment':
          from = operation.from
          to = operation.to
          amount = operation.amount
          asset = operation.asset_code || 'XDB'
          if (operation.to === accountId) {
            tag = <Badge className="bg-green-500 text-white">Received</Badge>
          } else if (operation.from === accountId) {
            tag = <Badge className="bg-red-500 text-white">Sent</Badge>
          }
          return { type: 'Payment', from, to, amount, tag, asset, index }
        case 'create_account':
          from = operation.funder
          to = operation.account
          amount = operation.starting_balance
          tag = <Badge className="bg-blue-500 text-white">Creation</Badge>
          return { type: 'Account Creation', from, to, amount, tag, asset, index }
        case 'change_trust':
          from = operation.account
          tag = <Badge className="bg-yellow-500 text-white">Trust</Badge>
          asset = operation.asset_code || 'XDB'
          return { type: 'Change Trust', from, to: null, amount: null, tag, asset, index }
        case 'manage_sell_offer':
          from = operation.seller
          tag = <Badge className="bg-purple-500 text-white">Sell</Badge>
          asset = operation.selling_asset_code || 'XDB'
          return { type: 'Sell Offer', from, to: null, amount: operation.amount, tag, asset, index }
        case 'manage_buy_offer':
          from = operation.buyer
          tag = <Badge className="bg-indigo-500 text-white">Buy</Badge>
          asset = operation.buying_asset_code || 'XDB'
          return { type: 'Buy Offer', from, to: null, amount: operation.buy_amount, tag, asset, index }
        case 'set_options':
          from = operation.account
          tag = <Badge className="bg-gray-500 text-white">Options</Badge>
          return { type: 'Set Options', from, to: null, amount: null, tag, asset, index }
        case 'account_merge':
          from = operation.account
          to = operation.into
          tag = <Badge className="bg-orange-500 text-white">Merge</Badge>
          return { type: 'Account Merge', from, to, amount: null, tag, asset, index }
        case 'allow_trust':
          from = operation.asset_issuer
          to = operation.trustor
          tag = <Badge className="bg-teal-500 text-white">Allow</Badge>
          asset = operation.asset_code || 'XDB'
          return { type: 'Allow Trust', from, to, amount: null, tag, asset, index }
        case 'bump_sequence':
          from = operation.account
          tag = <Badge className="bg-pink-500 text-white">Sequence</Badge>
          return { type: 'Bump Sequence', from, to: null, amount: null, tag, asset, index }
        case 'path_payment_strict_receive':
        case 'path_payment_strict_send':
          from = operation.from
          to = operation.to
          amount = operation.dest_amount || operation.source_amount
          asset = operation.dest_asset_code || operation.source_asset_code || 'XDB'
          tag = <Badge className="bg-cyan-500 text-white">Path</Badge>
          return { type: 'Path Payment', from, to, amount, tag, asset, index }
        default:
          tag = <Badge className="bg-gray-400 text-white">Other</Badge>
          return { type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), from: null, to: null, amount: null, tag, asset: 'XDB', index }
      }
    })
  }

  // Function to get only the first operation (compatibility)
  const getOperationDetails = (transaction, accountId) => {
    const allOps = getAllOperationDetails(transaction, accountId)
    return allOps[0] || { type: 'Generic Transaction', from: null, to: null, amount: null, tag: <Badge className="bg-gray-400 text-white">Generic</Badge>, asset: 'XDB' }
  }

  // Calculate current page transactions
  const currentTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return allTransactions.slice(startIndex, endIndex)
  }, [allTransactions, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(allTransactions.length / itemsPerPage)

  // Navigation functions
  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => {
    const nextPage = Math.min(totalPages, currentPage + 1)
    setCurrentPage(nextPage)
    
    // If we're near the end and there's more data, load more
    if (nextPage > totalPages - 2 && hasMoreData && !loadingMore && walletAddress.trim()) {
      loadMoreTransactionsInBackground(walletAddress.trim(), nextCursor)
    }
  }

  // Generate page numbers for display
  const getPageNumbers = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  // Effect for automatic address validation
  useEffect(() => {
    if (debouncedWalletAddress && !isValidAddress(debouncedWalletAddress) && !isValidTransactionHash(debouncedWalletAddress)) {
      if (debouncedWalletAddress.length > 10) { // Only show error if user typed something significant
        setError('Invalid format. Enter a wallet address (56 characters, starting with "G") or transaction hash (64 hexadecimal characters).')
      }
    } else {
      setError('')
    }
  }, [debouncedWalletAddress])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
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
          className="max-w-2xl mx-auto mb-8"
        >
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search
              </CardTitle>
              <CardDescription>
                Enter a wallet address (56 characters, starting with "G") or transaction hash (64 hexadecimal characters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., GABCASXIBIQB5PHRXIN5R7FW3DPF3KRDCD2G5KE4VHRZDZTEZ5JR2CGV or 042dc803e27b9b49c6cccc5947025991168e0989345c2848dc0c6f183d0578e4"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className={`flex-1 ${error && walletAddress ? 'border-red-500' : ''}`}
                />
                <Button 
                  onClick={() => handleSearch()} 
                  disabled={loading || (!isValidAddress(walletAddress) && !isValidTransactionHash(walletAddress))}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
                {(accountInfo || transactionDetails) && (
                  <Button 
                    onClick={handleRefresh} 
                    disabled={loading}
                    variant="outline"
                    size="icon"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}
              {walletAddress && (isValidAddress(walletAddress) || isValidTransactionHash(walletAddress)) && !error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                >
                  <CheckCircle className="h-4 w-4" />
                  {isValidAddress(walletAddress) ? 'Valid wallet address' : 'Valid transaction hash'}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Details (when searching by hash) */}
        <AnimatePresence>
          {transactionDetails && searchType === 'transaction' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto mb-8"
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                        <div className="text-sm text-muted-foreground">Hash</div>
                        <div className="text-sm font-mono break-all">{transactionDetails.hash}</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
                        <div className="text-sm text-muted-foreground">Date</div>
                        <div className="text-sm font-medium">{formatDate(transactionDetails.created_at)}</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                        <div className="text-sm text-muted-foreground">Operations</div>
                        <div className="text-lg font-bold text-purple-600">{transactionDetails.operation_count}</div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg dark:bg-orange-900/20">
                        <div className="text-sm text-muted-foreground">Fee</div>
                        <div className="text-lg font-bold text-orange-600">{formatXDB(transactionDetails.fee_charged)}</div>
                      </div>
                    </div>
                    
                    {/* Transaction operations */}
                    {transactionDetails.operations && transactionDetails.operations.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Operations</h3>
                        <div className="space-y-3">
                          {getAllOperationDetails(transactionDetails, null).map((opDetail, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                              <div className="flex items-center gap-2 mb-2">
                                {opDetail.tag}
                                {opDetail.amount && (
                                  <span className="font-medium">{formatAssetAmount(opDetail.amount, opDetail.asset)}</span>
                                )}
                              </div>
                              {opDetail.from && (
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">From: </span>
                                  <a 
                                    href="#" 
                                    onClick={() => handleSearch(opDetail.from)}
                                    className="text-blue-600 hover:underline font-mono"
                                  >
                                    {opDetail.from}
                                  </a>
                                </div>
                              )}
                              {opDetail.to && (
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">To: </span>
                                  <a 
                                    href="#" 
                                    onClick={() => handleSearch(opDetail.to)}
                                    className="text-blue-600 hover:underline font-mono"
                                  >
                                    {opDetail.to}
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account Info */}
        <AnimatePresence>
          {accountInfo && searchType === 'wallet' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto mb-8"
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="assets">Assets</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                          <div className="text-sm text-muted-foreground">XDB Balance</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {accountInfo.balances?.find(b => b.asset_type === 'native')?.balance 
                              ? formatXDB(accountInfo.balances.find(b => b.asset_type === 'native').balance)
                              : '0 XDB'}
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
                          <div className="text-sm text-muted-foreground">Sequence</div>
                          <div className="text-2xl font-bold text-green-600">
                            {accountInfo.sequence}
                          </div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                          <div className="text-sm text-muted-foreground">Transactions Loaded</div>
                          <div className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                            {allTransactions.length}
                            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                            {hasMoreData && <span className="text-sm font-normal">+</span>}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="assets" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accountInfo.balances?.map((balance, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-white dark:bg-gray-700/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Coins className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {balance.asset_type === 'native' ? 'XDB' : balance.asset_code}
                              </span>
                            </div>
                            <div className="text-2xl font-bold mb-2">
                              {balance.asset_type === 'native' 
                                ? formatXDB(balance.balance)
                                : `${parseFloat(balance.balance).toFixed(7)} ${balance.asset_code}`
                              }
                            </div>
                            {balance.asset_type !== 'native' && (
                              <div className="text-xs text-muted-foreground">
                                <div>Issuer: {balance.asset_issuer?.substring(0, 8)}...{balance.asset_issuer?.substring(balance.asset_issuer.length - 8)}</div>
                                {balance.limit && <div>Limit: {balance.limit}</div>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Account data entries */}
                      {accountInfo.data && Object.keys(accountInfo.data).length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Account Data
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(accountInfo.data).map(([key, value]) => (
                              <div key={key} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <div className="text-sm font-medium text-muted-foreground">{key}</div>
                                <div className="text-sm font-mono break-all">{value}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions List */}
        <AnimatePresence>
          {allTransactions.length > 0 && searchType === 'wallet' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Transaction History
                      </CardTitle>
                      <CardDescription>
                        {allTransactions.length} transactions loaded
                        {loadingMore && " (loading more...)"}
                        {hasMoreData && " (more available)"}
                      </CardDescription>
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
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence mode="wait">
                      {currentTransactions.map((tx, index) => {
                        const allOps = getAllOperationDetails(tx, walletAddress)
                        const primaryOp = allOps[0]
                        return (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-700/50"
                          >
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex-1">
                                {/* Hash and Date */}
                                <div className="flex items-center gap-3 mb-2">
                                  <Hash className="h-4 w-4 text-muted-foreground" />
                                  <code className="text-sm bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded font-mono">
                                    {tx.hash.substring(0, 16)}...{tx.hash.substring(tx.hash.length - 16)}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(tx.hash)}
                                    className="h-6 w-6 p-0"
                                  >
                                    {copiedHash === tx.hash ? (
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <span className="text-sm text-muted-foreground ml-auto">
                                    {formatDate(tx.created_at)}
                                  </span>
                                </div>
                                
                                {/* Primary operation */}
                                <div className="text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    {primaryOp.tag}
                                    {primaryOp.amount && (
                                      <span className="font-medium ml-2">{formatAssetAmount(primaryOp.amount, primaryOp.asset)}</span>
                                    )}
                                    {allOps.length > 1 && (
                                      <Badge variant="outline" className="ml-2">
                                        +{allOps.length - 1} operations
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {primaryOp.from && (
                                    <div className="mt-1">
                                      <span className="font-medium">From: </span>
                                      <a 
                                        href="#" 
                                        onClick={() => handleSearch(primaryOp.from)}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {primaryOp.from.substring(0, 8)}...{primaryOp.from.substring(primaryOp.from.length - 8)}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {primaryOp.to && (
                                    <div className="mt-1">
                                      <span className="font-medium">To: </span>
                                      <a 
                                        href="#" 
                                        onClick={() => handleSearch(primaryOp.to)}
                                        className="text-blue-600 hover:underline"
                                      >
                                        {primaryOp.to.substring(0, 8)}...{primaryOp.to.substring(primaryOp.to.length - 8)}
                                      </a>
                                    </div>
                                  )}
                                </div>

                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Operations:</span> {tx.operation_count} | 
                                  <span className="font-medium ml-2">Fee:</span> {formatXDB(tx.fee_charged)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSearch(tx.hash)}
                                  className="flex items-center gap-1"
                                >
                                  <Hash className="h-3 w-3" />
                                  Details
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`https://explorer.xdbchain.com/transaction/${tx.hash}`, '_blank')}
                                  className="flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Explorer
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, allTransactions.length)} of {allTransactions.length} transactions
                        {hasMoreData && " (more available)"}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToFirstPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1">
                          {getPageNumbers().map((pageNum, index) => (
                            pageNum === '...' ? (
                              <span key={index} className="px-2 py-1 text-muted-foreground">...</span>
                            ) : (
                              <Button
                                key={index}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            )
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToLastPage}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-muted-foreground"
        >
          <p>Built for exploring the XDB Chain • Data provided by Horizon API</p>
        </motion.footer>
      </div>
    </div>
  )
}

export default App

