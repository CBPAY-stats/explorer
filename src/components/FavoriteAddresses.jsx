import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Heart, Star, Trash2, Plus, Edit, Copy, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const FavoriteAddresses = ({ currentAddress, onAddressSelect }) => {
  const [favorites, setFavorites] = useState([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingFavorite, setEditingFavorite] = useState(null)
  const [newFavorite, setNewFavorite] = useState({ address: '', name: '', description: '' })

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('xdb-favorite-addresses')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (error) {
        console.error('Error loading favorites:', error)
      }
    }
  }, [])

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('xdb-favorite-addresses', JSON.stringify(favorites))
  }, [favorites])

  const isValidAddress = (address) => {
    return address && address.length === 56 && address.match(/^G[A-Z2-7]{55}$/)
  }

  const addFavorite = () => {
    if (!isValidAddress(newFavorite.address)) {
     alert("Please enter a valid XDB Chain address (56 characters, starting with \"G\")")      return
    }

    if (!newFavorite.name.trim()) {
      alert("Please enter a name for this address")
      return
    }

    // Check if address already exists
    if (favorites.some(fav => fav.address === newFavorite.address)) {
      alert("This address is already in your favorites")
      return
    }

    const favorite = {
      id: Date.now().toString(),
      address: newFavorite.address,
      name: newFavorite.name.trim(),
      description: newFavorite.description.trim(),
      dateAdded: new Date().toISOString()
    }

    setFavorites(prev => [...prev, favorite])
    setNewFavorite({ address: '', name: '', description: '' })
    setIsAddDialogOpen(false)
  }

  const updateFavorite = () => {
    if (!editingFavorite) return

    if (!editingFavorite.name.trim()) {
      alert("Please enter a name for this address")
      return
    }
    setFavorites(prev => prev.map(fav => 
      fav.id === editingFavorite.id 
        ? { ...fav, name: editingFavorite.name.trim(), description: editingFavorite.description.trim() }
        : fav
    ))
    setEditingFavorite(null)
  }

  const removeFavorite = (id) => {
    if (confirm("Are you sure you want to remove this favorite address?")) {
      setFavorites(prev => prev.filter(fav => fav.id !== id))
    }
  }

  const addCurrentAddress = () => {
    if (!currentAddress || !isValidAddress(currentAddress)) {
      alert("No valid address currently loaded")
      return
    }

    if (favorites.some(fav => fav.address === currentAddress)) {
      alert('This address is already in your favorites')
      return
    }

    setNewFavorite({ 
      address: currentAddress, 
      name: `Wallet ${currentAddress.slice(0, 8)}...`, 
      description: 'Added from current search' 
    })
    setIsAddDialogOpen(true)
  }

  const copyAddress = (address) => {
    navigator.clipboard.writeText(address)
    // You could add a toast notification here
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <CardTitle>Favorite Addresses</CardTitle>
            <Badge variant="secondary">{favorites.length}</Badge>
          </div>
          <div className="flex gap-2">
            {currentAddress && (
              <Button
                variant="outline"
                size="sm"
                onClick={addCurrentAddress}
                className="text-xs"
              >
                <Heart className="h-3 w-3 mr-1" />
                Add Current
              </Button>
            )}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Favorite Address</DialogTitle>
                  <DialogDescription>
                    Add a new XDB Chain address to your favorites for quick access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="GABCASXIBIQB5PHRXIN5R7FW3DPF3KRDCD2G5KE4VHRZ..."
                      value={newFavorite.address}
                      onChange={(e) => setNewFavorite(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      placeholder="e.g., My Main Wallet, Exchange Account..."
                      value={newFavorite.name}
                      onChange={(e) => setNewFavorite(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      placeholder="Additional notes about this address..."
                      value={newFavorite.description}
                      onChange={(e) => setNewFavorite(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addFavorite}>Add Favorite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription>
          Save frequently used addresses for quick access
        </CardDescription>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No favorite addresses yet</p>
            <p className="text-sm">Add addresses you frequently check to access them quickly</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {favorites.map((favorite) => (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">{favorite.name}</h4>
                        {favorite.address === currentAddress && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-mono break-all mb-2">
                        {favorite.address}
                      </p>
                      {favorite.description && (
                        <p className="text-xs text-muted-foreground mb-2">{favorite.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added {formatDate(favorite.dateAdded)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAddressSelect(favorite.address)}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAddress(favorite.address)}
                        className="text-xs"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingFavorite({ ...favorite })}
                        className="text-xs"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFavorite(favorite.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingFavorite} onOpenChange={() => setEditingFavorite(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Favorite Address</DialogTitle>
              <DialogDescription>
                Update the name and description for this favorite address.
              </DialogDescription>
            </DialogHeader>
            {editingFavorite && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={editingFavorite.address} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={editingFavorite.name}
                    onChange={(e) => setEditingFavorite(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={editingFavorite.description}
                    onChange={(e) => setEditingFavorite(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFavorite(null)}>
                Cancel
              </Button>
              <Button onClick={updateFavorite}>Update Favorite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default FavoriteAddresses

