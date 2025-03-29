"use client"

import { useState, useEffect } from "react"
import { PlusIcon, SearchIcon, PrinterIcon, SaveIcon, Trash2Icon, MinusIcon, ShoppingCartIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { initialCustomers } from "@/lib/initial-data"
import { BillPrintPreview } from "@/components/bill-print-preview"
import { BillDialog } from "@/components/bill-dialog"
import { PaymentDialog } from "@/components/payment-dialog"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useLogStore } from "@/lib/stores/log-store"
import { CartDialog } from "@/components/cart-dialog"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  totalSpent: number
  lastPurchase: string
}

type BillItem = {
  id: string
  name: string
  quantity: number
  price: number
  total: number
}

type Bill = {
  id: string
  customerId: string
  customerName: string
  date: string
  items: BillItem[]
  subtotal: number
  discount: number
  total: number
  amountPaid: number
  balance: number
  status: "paid" | "partial" | "unpaid"
}

type CartItem = {
  id: string
  name: string
  quantity: number
  price: number
  total: number
}

export function BillingSystem() {
  const { toast } = useToast()
  const { currencySymbol } = useCurrencyStore()
  const { addLog } = useLogStore()

  const [customers] = useLocalStorage<Customer[]>("customers", initialCustomers)
  const [bills, setBills] = useLocalStorage<Bill[]>("bills", [])
  const [cart, setCart] = useLocalStorage<CartItem[]>("current-cart", [])

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
  const [isNewBillDialogOpen, setIsNewBillDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Filter bills based on search query
    if (searchQuery) {
      setFilteredBills(
        bills.filter(
          (bill) =>
            bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bill.id.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredBills(bills)
    }
  }, [bills, searchQuery])

  const handleAddBill = (newBill: Omit<Bill, "id" | "status">) => {
    const billId = `BILL-RS{Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`

    const bill: Bill = {
      ...newBill,
      id: billId,
      status: newBill.amountPaid >= newBill.total ? "paid" : newBill.amountPaid > 0 ? "partial" : "unpaid",
    }

    setBills((prev) => [bill, ...prev])

    // Clear cart after creating bill
    setCart([])

    // Add to log
    addLog({
      action: "create_bill",
      details: `Created bill RS{billId} for RS{newBill.customerName}`,
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Bill created",
      description: `Bill #RS{billId} has been created successfully`,
    })

    setIsNewBillDialogOpen(false)
  }

  const handlePayment = (billId: string, amount: number, discount: number) => {
    setBills((prev) =>
      prev.map((bill) => {
        if (bill.id === billId) {
          const newAmountPaid = bill.amountPaid + amount
          const newDiscount = bill.discount + discount
          const newTotal = bill.subtotal - newDiscount
          const newBalance = newTotal - newAmountPaid

          const newStatus = newBalance <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "unpaid"

          // Add to log
          addLog({
            action: "payment_received",
            details: `Received payment of RS{currencySymbol}RS{amount} for bill RS{billId}. Discount: RS{currencySymbol}RS{discount}`,
            timestamp: new Date().toISOString(),
          })

          return {
            ...bill,
            amountPaid: newAmountPaid,
            discount: newDiscount,
            total: newTotal,
            balance: newBalance,
            status: newStatus,
          }
        }
        return bill
      }),
    )

    toast({
      title: "Payment recorded",
      description: `Payment of RS{currencySymbol}RS{amount} has been recorded successfully`,
    })

    setIsPaymentDialogOpen(false)
  }

  const handlePrintBill = (bill: Bill) => {
    setSelectedBill(bill)
    setIsPrintPreviewOpen(true)
  }

  const handleDeleteBill = (billId: string) => {
    if (confirm("Are you sure you want to delete this bill? This action cannot be undone.")) {
      setBills((prev) => prev.filter((bill) => bill.id !== billId))

      // Add to log
      addLog({
        action: "delete_bill",
        details: `Deleted bill RS{billId}`,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Bill deleted",
        description: "The bill has been deleted successfully",
      })
    }
  }

  const handleAddToCart = (item: CartItem) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex((cartItem) => cartItem.name === item.name)

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      setCart((prev) =>
        prev.map((cartItem, index) => {
          if (index === existingItemIndex) {
            const newQuantity = cartItem.quantity + item.quantity
            return {
              ...cartItem,
              quantity: newQuantity,
              total: newQuantity * cartItem.price,
            }
          }
          return cartItem
        }),
      )
    } else {
      // Add new item to cart
      setCart((prev) => [
        ...prev,
        {
          ...item,
          id: crypto.randomUUID(),
          total: item.quantity * item.price,
        },
      ])
    }

    toast({
      title: "Item added to cart",
      description: `RS{item.name} has been added to the cart`,
    })

    setIsCartDialogOpen(false)
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId))

    toast({
      title: "Item removed",
      description: "Item has been removed from the cart",
    })
  }

  const getStatusColor = (status: Bill["status"]) => {
    switch (status) {
      case "paid":
        return "text-green-600 dark:text-green-400"
      case "partial":
        return "text-amber-600 dark:text-amber-400"
      case "unpaid":
        return "text-red-600 dark:text-red-400"
      default:
        return ""
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Billing System</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsCartDialogOpen(true)} variant="outline">
            <ShoppingCartIcon className="mr-2 h-4 w-4" />
            Cart ({cart.length})
          </Button>
          <Button onClick={() => setIsNewBillDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Bill
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Bills</CardTitle>
              <div className="relative w-64">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No bills found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">{bill.id}</TableCell>
                          <TableCell>{bill.date}</TableCell>
                          <TableCell>{bill.customerName}</TableCell>
                          <TableCell className="text-right">
                            {currencySymbol}
                            {bill.total.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {currencySymbol}
                            {bill.amountPaid.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {currencySymbol}
                            {bill.balance.toLocaleString()}
                          </TableCell>
                          <TableCell className={getStatusColor(bill.status)}>
                            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePrintBill(bill)}
                                title="Print Bill"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </Button>
                              {bill.status !== "paid" && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedBill(bill)
                                    setIsPaymentDialogOpen(true)
                                  }}
                                  title="Record Payment"
                                >
                                  <SaveIcon className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteBill(bill.id)}
                                title="Delete Bill"
                              >
                                <Trash2Icon className="h-4 w-4" />
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

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Current Cart</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Cart is empty</div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x {currencySymbol}
                          {item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {currencySymbol}
                          {item.total}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.id)}>
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between pt-2">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold">
                      {currencySymbol}
                      {cart.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                    </span>
                  </div>

                  <Button className="w-full" onClick={() => setIsNewBillDialogOpen(true)} disabled={cart.length === 0}>
                    Create Bill
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bill Print Preview */}
      {selectedBill && (
        <BillPrintPreview bill={selectedBill} open={isPrintPreviewOpen} onOpenChange={setIsPrintPreviewOpen} />
      )}

      {/* New Bill Dialog */}
      <BillDialog
        open={isNewBillDialogOpen}
        onOpenChange={setIsNewBillDialogOpen}
        onSubmit={handleAddBill}
        customers={customers}
        cartItems={cart}
      />

      {/* Payment Dialog */}
      {selectedBill && (
        <PaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          bill={selectedBill}
          onSubmit={handlePayment}
        />
      )}

      {/* Cart Dialog */}
      <CartDialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen} onAddToCart={handleAddToCart} />
    </div>
  )
}

