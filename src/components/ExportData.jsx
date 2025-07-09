import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const ExportData = ({ transactions, accountInfo, walletAddress }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')

  const formatTransactionForExport = (transaction) => {
    const operations = transaction.operations || []
    const mainOperation = operations[0] || {}
    
    return {
      'Transaction Hash': transaction.hash || '',
      'Date': transaction.created_at ? format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
      'Type': mainOperation.type_i ? getOperationType(mainOperation.type_i) : '',
      'Amount': getTransactionAmount(transaction),
      'Asset': getTransactionAsset(transaction),
      'From': getTransactionFrom(transaction),
      'To': getTransactionTo(transaction),
      'Fee': transaction.fee_charged ? `${(transaction.fee_charged / 10000000).toFixed(7)} XDB` : '',
      'Memo': transaction.memo || '',
      'Successful': transaction.successful ? 'Yes' : 'No',
      'Ledger': transaction.ledger || '',
      'Source Account': transaction.source_account || ''
    }
  }

  const getOperationType = (typeI) => {
    const types = {
      0: 'Create Account',
      1: 'Payment',
      2: 'Path Payment Strict Receive',
      3: 'Manage Sell Offer',
      4: 'Create Passive Sell Offer',
      5: 'Set Options',
      6: 'Change Trust',
      7: 'Allow Trust',
      8: 'Account Merge',
      9: 'Inflation',
      10: 'Manage Data',
      11: 'Bump Sequence',
      12: 'Manage Buy Offer',
      13: 'Path Payment Strict Send'
    }
    return types[typeI] || 'Unknown'
  }

  const getTransactionAmount = (transaction) => {
    const operations = transaction.operations || []
    for (const op of operations) {
      if (op.amount) {
        return `${parseFloat(op.amount).toFixed(7)}`
      }
      if (op.starting_balance) {
        return `${parseFloat(op.starting_balance).toFixed(7)}`
      }
    }
    return ''
  }

  const getTransactionAsset = (transaction) => {
    const operations = transaction.operations || []
    for (const op of operations) {
      if (op.asset_type === 'native') return 'XDB'
      if (op.asset_code) return op.asset_code
    }
    return 'XDB'
  }

  const getTransactionFrom = (transaction) => {
    const operations = transaction.operations || []
    for (const op of operations) {
      if (op.from) return op.from
      if (op.source_account) return op.source_account
    }
    return transaction.source_account || ''
  }

  const getTransactionTo = (transaction) => {
    const operations = transaction.operations || []
    for (const op of operations) {
      if (op.to) return op.to
      if (op.destination) return op.destination
    }
    return ''
  }

  const exportToCSV = () => {
    const formattedData = transactions.map(formatTransactionForExport)
    
    const csv = Papa.unparse(formattedData, {
      header: true,
      delimiter: ','
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `xdb-transactions-${walletAddress.slice(0, 8)}-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('XDB Chain Transaction Report', 20, 20)
    
    doc.setFontSize(12)
    doc.text(`Wallet Address: ${walletAddress}`, 20, 35)
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 20, 45)
    doc.text(`Total Transactions: ${transactions.length}`, 20, 55)
    
    if (accountInfo) {
      doc.text(`Current Balance: ${accountInfo.balances?.find(b => b.asset_type === 'native')?.balance || '0'} XDB`, 20, 65)
      doc.text(`Account Sequence: ${accountInfo.sequence || 'N/A'}`, 20, 75)
    }

    // Transactions table
    const tableData = transactions.slice(0, 50).map(transaction => {
      const formatted = formatTransactionForExport(transaction)
      return [
        formatted['Date'].split(' ')[0], // Date only
        formatted['Type'],
        formatted['Amount'],
        formatted['Asset'],
        formatted['From'].slice(0, 12) + '...',
        formatted['To'].slice(0, 12) + '...',
        formatted['Fee']
      ]
    })

    doc.autoTable({
      head: [['Date', 'Type', 'Amount', 'Asset', 'From', 'To', 'Fee']],
      body: tableData,
      startY: 85,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { top: 85 }
    })

    if (transactions.length > 50) {
      const finalY = doc.lastAutoTable.finalY + 10
      doc.text(`Note: Only showing first 50 transactions. Total: ${transactions.length}`, 20, finalY)
    }

    doc.save(`xdb-transactions-${walletAddress.slice(0, 8)}-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
  }

  const handleExport = async () => {
    if (!transactions || transactions.length === 0) {
      alert('No transactions to export')
      return
    }

    setIsExporting(true)
    
    try {
      if (exportFormat === 'csv') {
        exportToCSV()
      } else if (exportFormat === 'pdf') {
        exportToPDF()
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Transaction Data
        </CardTitle>
        <CardDescription>
          Download your transaction history in CSV or PDF format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Spreadsheet)
                </div>
              </SelectItem>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF (Report)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {exportFormat === 'csv' && (
            <p>CSV format includes all transaction details and can be opened in Excel or Google Sheets.</p>
          )}
          {exportFormat === 'pdf' && (
            <p>PDF format creates a formatted report with account summary and transaction history (limited to 50 transactions).</p>
          )}
        </div>

        <Button 
          onClick={handleExport} 
          disabled={isExporting || !transactions || transactions.length === 0}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {exportFormat.toUpperCase()} ({transactions?.length || 0} transactions)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ExportData

