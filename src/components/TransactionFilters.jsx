import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Calendar, Filter, X, DollarSign, Clock, Tag } from 'lucide-react'
import { format } from 'date-fns'

const TransactionFilters = ({ filters, onFiltersChange, onClearFilters, transactionCount }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.type && filters.type !== 'all') count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++
    if (filters.minAmount) count++
    if (filters.maxAmount) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Transaction Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
        {transactionCount !== undefined && (
          <CardDescription>
            {transactionCount} transactions found
          </CardDescription>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Type Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Transaction Type
              </Label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="create_account">Account Creation</SelectItem>
                  <SelectItem value="change_trust">Trust Change</SelectItem>
                  <SelectItem value="allow_trust">Allow Trust</SelectItem>
                  <SelectItem value="manage_sell_offer">Sell Offer</SelectItem>
                  <SelectItem value="manage_buy_offer">Buy Offer</SelectItem>
                  <SelectItem value="set_options">Set Options</SelectItem>
                  <SelectItem value="merge_account">Account Merge</SelectItem>
                  <SelectItem value="bump_sequence">Bump Sequence</SelectItem>
                  <SelectItem value="path_payment_strict_receive">Path Payment (Receive)</SelectItem>
                  <SelectItem value="path_payment_strict_send">Path Payment (Send)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                From Date
              </Label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                max={filters.dateTo || format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Date To Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                To Date
              </Label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                min={filters.dateFrom}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Min Amount Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Min Amount (XDB)
              </Label>
              <Input
                type="number"
                step="0.0000001"
                min="0"
                placeholder="0.0000000"
                value={filters.minAmount || ''}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              />
            </div>

            {/* Max Amount Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Max Amount (XDB)
              </Label>
              <Input
                type="number"
                step="0.0000001"
                min={filters.minAmount || "0"}
                placeholder="No limit"
                value={filters.maxAmount || ''}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {filters.type && filters.type !== 'all' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Type: {filters.type.replace('_', ' ')}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleFilterChange('type', 'all')}
                    />
                  </Badge>
                )}
                {filters.dateFrom && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    From: {format(new Date(filters.dateFrom), 'MMM dd, yyyy')}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleFilterChange('dateFrom', '')}
                    />
                  </Badge>
                )}
                {filters.dateTo && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    To: {format(new Date(filters.dateTo), 'MMM dd, yyyy')}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleFilterChange('dateTo', '')}
                    />
                  </Badge>
                )}
                {filters.minAmount && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Min: {filters.minAmount} XDB
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleFilterChange('minAmount', '')}
                    />
                  </Badge>
                )}
                {filters.maxAmount && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Max: {filters.maxAmount} XDB
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-red-500" 
                      onClick={() => handleFilterChange('maxAmount', '')}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default TransactionFilters

