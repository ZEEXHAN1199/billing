"use client"

import { useState, useEffect } from "react"
import { PlusIcon, SearchIcon, PrinterIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // Added Textarea import
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useBillingStore } from "@/lib/stores/billing-store"
import { useCustomerStore } from "@/lib/stores/customer-store"
import { useInventoryStore } from "@/lib/stores/inventory-store"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useLogStore } from "@/lib/stores/log-store"
import { CompanyInfoModal } from "@/components/company-info-modal"
import { BillPrintPreview } from "@/components/bill-print-preview"
import type { BillItem } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

export function BillingSystemNew() {
  const { toast } = useToast()
  const { currencySymbol } = useCurrencyStore()
  const { addLog } = useLogStore()
  const { customers } = useCustomerStore()
  const { products } = useInventoryStore()
  const { cart, addToCart, updateCartItem, removeFromCart, clearCart, generateBill, getCartTotal, editingBillId } =
    useBillingStore()

  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [description, setDescription] = useState("") // Added description state
  const [invoiceId, setInvoiceId] = useState("")
  const [autoInvoiceMode, setAutoInvoiceMode] = useState(true)
  const [isCompanyInfoModalOpen, setIsCompanyInfoModalOpen] = useState(false)
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState(customers)
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false)
  const [isProductPopoverOpen, setIsProductPopoverOpen] = useState(false)

  // Generate invoice ID on load
  useEffect(() => {
    if (autoInvoiceMode && !invoiceId && !editingBillId) {
      generateAutoInvoiceId()
    }
  }, [autoInvoiceMode, invoiceId, editingBillId])

  // Filter customers based on search
  useEffect(() => {
    if (customerSearchQuery) {
      setFilteredCustomers(
        customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
            customer.phone.includes(customerSearchQuery),
        ),
      )
    } else {
      setFilteredCustomers(customers)
    }
  }, [customers, customerSearchQuery])

  // Filter products based on search
  useEffect(() => {
    if (productSearchQuery) {
      setFilteredProducts(
        products.filter(
          (product) =>
            product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(productSearchQuery.toLowerCase())),
        ),
      )
    } else {
      setFilteredProducts(products.filter((p) => p.quantity > 0))
    }
  }, [products, productSearchQuery])

  // Set description when product is selected
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId)
      if (product) {
        setDescription(product.description || "")
      }
    }
  }, [selectedProductId, products])

  const generateAutoInvoiceId = () => {
    const counter = useBillingStore.getState().invoiceCounter
    setInvoiceId(`INV-${counter}`)
  }

  const toggleInvoiceIdMode = () => {
    setAutoInvoiceMode(!autoInvoiceMode)
    if (!autoInvoiceMode) {
      generateAutoInvoiceId()
    } else {
      setInvoiceId("")
    }
  }

  const handleAddToCart = () => {
    if (!selectedProductId || quantity <= 0) {
      toast({
        title: "Invalid selection",
        description: "Please select a product and enter a valid quantity",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    if (product.quantity < quantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${product.quantity} units available`,
        variant: "destructive",
      })
      return
    }

    addToCart({
      name: product.name,
      description: description, // Add description to cart item
      price: product.price,
      quantity,
    })

    toast({
      title: "Item added",
      description: `${product.name} added to cart`,
    })

    // Reset product selection
    setSelectedProductId("")
    setProductSearchQuery("")
    setQuantity(1)
    setDescription("") // Reset description
    setIsProductPopoverOpen(false)
  }

  const handleCartItemUpdate = (id: string, field: keyof BillItem, value: number | string) => {
    if (field === "quantity") {
      const numValue = typeof value === "string" ? Number.parseInt(value) : value
      if (numValue <= 0) return

      // Check if we have enough stock
      const item = cart.find((i) => i.id === id)
      if (!item) return

      const product = products.find((p) => p.name === item.name)
      if (product && product.quantity < numValue) {
        toast({
          title: "Insufficient stock",
          description: `Only ${product.quantity} units available`,
          variant: "destructive",
        })
        return
      }

      updateCartItem(id, { quantity: numValue })
    } else if (field === "price") {
      const numValue = typeof value === "string" ? Number.parseFloat(value) : value
      if (numValue <= 0) return

      updateCartItem(id, { price: numValue })
    } else if (field === "description") {
      // Handle description updates
      updateCartItem(id, { description: value as string })
    }
  }

  const validateAndGenerateInvoice = (status: "paid" | "partial" | "unpaid") => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to the cart before generating an invoice",
        variant: "destructive",
      })
      return
    }

    if (!invoiceId) {
      toast({
        title: "Missing invoice ID",
        description: "Please enter an invoice ID or enable auto mode",
        variant: "destructive",
      })
      return
    }

    if (!selectedCustomerId) {
      toast({
        title: "No customer selected",
        description: "Please select a customer for this invoice",
        variant: "destructive",
      })
      return
    }

    const customer = customers.find((c) => c.id === selectedCustomerId)
    if (!customer) return

    // For simplicity, we're assuming full payment and no discount
    // In a real app, you'd have a payment dialog
    const amountPaid = status === "paid" ? getCartTotal() : 0
    const discount = 0

    generateBill(customer.id, customer.name, status, amountPaid, discount)

    toast({
      title: "Invoice generated",
      description: `Invoice ${invoiceId} has been generated as ${status}`,
    })

    // Reset form
    setInvoiceId("")
    setSelectedCustomerId("")
    if (autoInvoiceMode) {
      generateAutoInvoiceId()
    }
  }

  const validateAndPrintBill = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to the cart before printing",
        variant: "destructive",
      })
      return
    }

    if (!selectedCustomerId) {
      toast({
        title: "No customer selected",
        description: "Please select a customer for this bill",
        variant: "destructive",
      })
      return
    }

    setIsPrintPreviewOpen(true)
  }

  const getSelectedCustomerName = () => {
    const customer = customers.find((c) => c.id === selectedCustomerId)
    return customer ? customer.name : ""
  }

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setIsCustomerPopoverOpen(false)

    // Find the customer name for display
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      setCustomerSearchQuery(customer.name)
    }
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId)
    setIsProductPopoverOpen(false)

    // Find the product name for display
    const product = products.find((p) => p.id === productId)
    if (product) {
      setProductSearchQuery(product.name)
      setDescription(product.description || "")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Billing System</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice ID:</label>
              <div className="flex">
                <Input
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  placeholder={autoInvoiceMode ? "Auto-generated" : "Enter invoice ID"}
                  disabled={autoInvoiceMode}
                  className="rounded-r-none"
                />
                <Button
                  variant={autoInvoiceMode ? "default" : "outline"}
                  onClick={toggleInvoiceIdMode}
                  className="rounded-l-none"
                >
                  {autoInvoiceMode ? "Auto" : "Manual"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Customer:</label>
              <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      placeholder="Search customer..."
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value)
                        setIsCustomerPopoverOpen(true)
                      }}
                      onClick={() => setIsCustomerPopoverOpen(true)}
                    />
                    <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="max-h-[300px] overflow-auto">
                    {filteredCustomers.length > 0 ? (
                      <div className="py-2">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="px-4 py-2 hover:bg-accent cursor-pointer"
                            onClick={() => handleSelectCustomer(customer.id)}
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.phone}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">No customers found</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedCustomerId && (
                <div className="text-sm text-muted-foreground">Selected: {getSelectedCustomerName()}</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Product:</label>
              <Popover open={isProductPopoverOpen} onOpenChange={setIsProductPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      placeholder="Search product..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value)
                        setIsProductPopoverOpen(true)
                      }}
                      onClick={() => setIsProductPopoverOpen(true)}
                    />
                    <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="max-h-[300px] overflow-auto">
                    {filteredProducts.length > 0 ? (
                      <div className="py-2">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="px-4 py-2 hover:bg-accent cursor-pointer"
                            onClick={() => handleSelectProduct(product.id)}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {currencySymbol}
                              {product.price.toFixed(2)} - {product.quantity} in stock
                            </div>
                            {product.description && (
                              <div className="text-xs text-muted-foreground truncate">{product.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">No products found</div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedProductId && (
                <div className="text-sm text-muted-foreground">
                  Selected: {products.find((p) => p.id === selectedProductId)?.name}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-end space-x-2">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                />
                <Button onClick={handleAddToCart}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Description field */}
          <div className="mb-6">
            <Label htmlFor="item-description" className="text-sm font-medium">
              Description:
            </Label>
            <Textarea
              id="item-description"
              placeholder="Product description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Cart</h2>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Price ({currencySymbol})</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total ({currencySymbol})</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Cart is empty. Add products to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <Input
                            value={item.description || ""}
                            onChange={(e) => handleCartItemUpdate(item.id, "description", e.target.value)}
                            className="w-full text-sm"
                            placeholder="Add description"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleCartItemUpdate(item.id, "price", e.target.value)}
                            className="w-20 text-right inline-block"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleCartItemUpdate(item.id, "quantity", e.target.value)}
                            className="w-20 text-right inline-block"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            title="Remove item"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {cart.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {currencySymbol}
                        {getCartTotal().toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="default" onClick={() => validateAndGenerateInvoice("paid")} disabled={cart.length === 0}>
                <SaveIcon className="h-4 w-4 mr-2" />
                Generate as Paid
              </Button>
              <Button
                variant="secondary"
                onClick={() => validateAndGenerateInvoice("partial")}
                disabled={cart.length === 0}
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Generate as Pending
              </Button>
              <Button variant="outline" onClick={validateAndPrintBill} disabled={cart.length === 0}>
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Bill
              </Button>
              {cart.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear the cart?")) {
                      clearCart()
                    }
                  }}
                >
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Info Modal */}
      <CompanyInfoModal open={isCompanyInfoModalOpen} onOpenChange={setIsCompanyInfoModalOpen} />

      {/* Bill Print Preview */}
      {selectedCustomerId && (
        <BillPrintPreview
          open={isPrintPreviewOpen}
          onOpenChange={setIsPrintPreviewOpen}
          invoiceId={invoiceId}
          customerName={getSelectedCustomerName()}
          items={cart}
          total={getCartTotal()}
        />
      )}
    </div>
  )
}

