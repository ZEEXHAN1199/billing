"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { SearchIcon, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useInventoryStore } from "@/lib/stores/inventory-store"
import { useLogStore } from "@/lib/stores/log-store"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import type { Product } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function InventoryManagement() {
  const { toast } = useToast()
  const { products, addProduct, updateProduct, deleteProduct } = useInventoryStore()
  const { addLog } = useLogStore()
  const { currencySymbol } = useCurrencyStore()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("") // Added description state
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  useEffect(() => {
    // Filter products based on search query and low stock filter
    let filtered = products

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (lowStockOnly) {
      filtered = filtered.filter((product) => product.quantity < 5)
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, lowStockOnly])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const priceValue = Number.parseFloat(price)
    const quantityValue = Number.parseInt(quantity)

    if (!name || isNaN(priceValue) || isNaN(quantityValue)) {
      toast({
        title: "Missing information",
        description: "Please provide a name, valid price, and quantity",
        variant: "destructive",
      })
      return
    }

    if (editingProductId) {
      // Update existing product
      updateProduct(editingProductId, {
        name,
        description, // Added description
        price: priceValue,
        quantity: quantityValue,
      })

      addLog({
        action: "update_product",
        details: `Updated product: ${name}, Price: ${currencySymbol}${priceValue}, Quantity: ${quantityValue}`,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Product updated",
        description: "Product has been updated successfully",
      })
    } else {
      // Add new product
      addProduct({
        name,
        description, // Added description
        price: priceValue,
        quantity: quantityValue,
      })

      addLog({
        action: "add_product",
        details: `Added new product: ${name}, Price: ${currencySymbol}${priceValue}, Quantity: ${quantityValue}`,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Product added",
        description: "New product has been added successfully",
      })
    }

    // Reset form
    setName("")
    setDescription("")
    setPrice("")
    setQuantity("")
    setEditingProductId(null)
  }

  const handleEdit = (product: Product) => {
    setName(product.name)
    setDescription(product.description || "")
    setPrice(product.price.toString())
    setQuantity(product.quantity.toString())
    setEditingProductId(product.id)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}"?`)) {
      deleteProduct(id)

      addLog({
        action: "delete_product",
        details: `Deleted product: ${name}`,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Product deleted",
        description: "Product has been deleted successfully",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add/Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="Product Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Price</Label>
                <Input
                  id="product-price"
                  placeholder={`Price (${currencySymbol})`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-quantity">Quantity</Label>
                <Input
                  id="product-quantity"
                  placeholder="Quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Product Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit">{editingProductId ? "Update Product" : "Add Product"}</Button>

              {editingProductId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setName("")
                    setDescription("")
                    setPrice("")
                    setQuantity("")
                    setEditingProductId(null)
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Product List</CardTitle>
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="low-stock"
                checked={lowStockOnly}
                onCheckedChange={(checked) => setLowStockOnly(checked === true)}
              />
              <Label htmlFor="low-stock">Show low stock only</Label>
            </div>
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Price ({currencySymbol})</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{product.description || "-"}</TableCell>
                      <TableCell className="text-right">{product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell>
                        {product.quantity < 5 ? (
                          <div className="flex items-center text-amber-500">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span>Low Stock</span>
                          </div>
                        ) : (
                          <span className="text-green-500">In Stock</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            title="Edit Product"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(product.id, product.name)}
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

