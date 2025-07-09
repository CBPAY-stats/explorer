import React from 'react'
import { Button } from './ui/button'
import { Loader2 } from 'lucide-react'

const LoadMoreButton = ({ 
  onLoadMore, 
  loading, 
  hasMore, 
  totalLoaded, 
  className = "" 
}) => {
  if (!hasMore) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <p>Todas as transações foram carregadas ({totalLoaded} total)</p>
      </div>
    )
  }

  return (
    <div className={`text-center py-4 ${className}`}>
      <Button 
        onClick={onLoadMore}
        disabled={loading}
        variant="outline"
        className="min-w-[200px]"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </>
        ) : (
          `Carregar mais transações (${totalLoaded} carregadas)`
        )}
      </Button>
    </div>
  )
}

export default LoadMoreButton

