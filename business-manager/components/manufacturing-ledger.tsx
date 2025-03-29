"use client"

import { useState, useEffect } from "react"
import { SearchIcon, FileTextIcon, ShoppingBagIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useLogStore } from "@/lib/stores/log-store"
import { usePaymentStore } from "@/lib/stores/payment-store"
import { PaymentDialog } from "@/components/payment-dialog"
import { PaymentHistory } from "@/components/payment-history"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BillPrintPreview } from "@/components/bill-print-preview"

type ManufacturingOrder = {
  id: string
  date: string
  buyerName: string
  description: string
  total: number
  status: "pending" | "in-progress" | "completed" | "delivered"
}

type ManufacturingPayment = {
  id: string
  orderId: string
  date: string
  amount: number
  discount: number
  notes: string
}

export function ManufacturingLedger() {
  const { toast } = useToast()
  const { currencySymbol } = useCurrencyStore()
  const { addLog } = useLogStore()
  const { getPaymentsByRelated } = usePaymentStore()

  const [manufacturingOrders, setManufacturingOrders] = useLocalStorage<ManufacturingOrder[]>(
    "manufacturing-orders",
    [],
  )

  const [selectedBuyer, setSelectedBuyer] = useState<string | null>(null)
  const [buyerSearchQuery, setBuyerSearchQuery] = useState("")
  const [filteredBuyers, setFilteredBuyers] = useState<string[]>([])
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [activeTab, setActiveTab] = useState<"summary" | "orders" | "ledger">("summary")
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrder | null>(null)

  // New order form state
  const [newOrderBuyer, setNewOrderBuyer] = useState("")
  const [newOrderDescription, setNewOrderDescription] = useState("")
  const [newOrderTotal, setNewOrderTotal] = useState(0)

  // Get unique buyers from orders
  useEffect(() => {
    const uniqueBuyers = [...new Set(manufacturingOrders.map((order) => order.buyerName))]

    // Filter buyers based on search query
    if (buyerSearchQuery) {
      setFilteredBuyers(uniqueBuyers.filter((buyer) => buyer.toLowerCase().includes(buyerSearchQuery.toLowerCase())))
    } else {
      setFilteredBuyers(uniqueBuyers)
    }
  }, [manufacturingOrders, buyerSearchQuery])

  const getBuyerOrders = (buyer: string) => {
    return manufacturingOrders.filter((order) => order.buyerName === buyer)
  }

  const getOrderPayments = (orderId: string) => {
    return getPaymentsByRelated(orderId, "manufacturing")
  }

  // Get all payments for a buyer
  const getBuyerPayments = (buyer: string) => {
    return getPaymentsByRelated(buyer, "manufacturing")
  }

  const getTotalOrderPayments = (orderId: string) => {
    const payments = getOrderPayments(orderId)
    return payments.reduce((sum, payment) => {
      return payment.direction === "incoming" ? sum + payment.amount : sum - payment.amount
    }, 0)
  }

  const getTotalOrderDiscounts = (orderId: string) => {
    const payments = getOrderPayments(orderId)
    return payments.reduce((sum, payment) => sum + (payment.discount || 0), 0)
  }

  const calculateOrderBalance = (order: ManufacturingOrder) => {
    const totalPaid = getTotalOrderPayments(order.id)
    const totalDiscount = getTotalOrderDiscounts(order.id)
    return order.total - totalPaid - totalDiscount
  }

  const handleAddNewOrder = () => {
    if (!newOrderBuyer || newOrderTotal <= 0) {
      toast({
        title: "Invalid order details",
        description: "Please provide a buyer name and valid total amount",
        variant: "destructive",
      })
      return
    }

    const newOrder: ManufacturingOrder = {
      id: `ORD-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
      date: new Date().toISOString(),
      buyerName: newOrderBuyer,
      description: newOrderDescription,
      total: newOrderTotal,
      status: "pending",
    }

    setManufacturingOrders([...manufacturingOrders, newOrder])

    // Add to log
    addLog({
      action: "manufacturing_order_created",
      details: `Created new manufacturing order ${newOrder.id} for ${newOrderBuyer}`,
      timestamp: new Date().toISOString(),
    })

    // Reset form
    setNewOrderBuyer("")
    setNewOrderDescription("")
    setNewOrderTotal(0)
    setIsOrderDialogOpen(false)

    // If this is a new buyer, select them
    if (!filteredBuyers.includes(newOrderBuyer)) {
      setSelectedBuyer(newOrderBuyer)
    }

    toast({
      title: "Order created",
      description: `New manufacturing order has been created successfully`,
    })
  }

  const openPaymentDialog = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsPaymentDialogOpen(true)
  }

  const updateOrderStatus = (orderId: string, status: ManufacturingOrder["status"]) => {
    setManufacturingOrders((orders) => orders.map((order) => (order.id === orderId ? { ...order, status } : order)))

    // Add log
    addLog({
      action: "manufacturing_order_status_updated",
      details: `Updated manufacturing order ${orderId} status to ${status}`,
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Status updated",
      description: `Order status has been updated to ${status}`,
    })
  }

  // Calculate summary data for the buyer
  const getBuyerSummary = (buyer: string) => {
    const buyerOrders = getBuyerOrders(buyer)
    const totalOrderAmount = buyerOrders.reduce((sum, order) => sum + order.total, 0)

    const totalPaid = buyerOrders.reduce((sum, order) => sum + getTotalOrderPayments(order.id), 0)
    const totalDiscount = buyerOrders.reduce((sum, order) => sum + getTotalOrderDiscounts(order.id), 0)

    const balance = totalOrderAmount - totalPaid - totalDiscount

    return {
      totalOrders: buyerOrders.length,
      totalOrderAmount,
      totalPaid,
      totalDiscount,
      balance,
      status: balance <= 0 ? "Fully Paid" : balance < totalOrderAmount ? "Partially Paid" : "Unpaid",
    }
  }

  const handleViewPrintOrder = (order: ManufacturingOrder) => {
    setSelectedOrder(order)
    setIsPrintPreviewOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Manufacturing Ledger</h1>
        <Button onClick={() => setIsOrderDialogOpen(true)}>Add New Order</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ShoppingBagIcon className="h-5 w-5 mr-2" />
              Buyers
            </CardTitle>
            <div className="relative mt-2">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search buyers..."
                className="pl-8"
                value={buyerSearchQuery}
                onChange={(e) => setBuyerSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBuyers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No buyers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBuyers.map((buyer) => (
                      <TableRow key={buyer} className={selectedBuyer === buyer ? "bg-accent" : ""}>
                        <TableCell>{buyer}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedBuyer(buyer)}>
                            <FileTextIcon className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedBuyer ? `Ledger for ${selectedBuyer}` : "Manufacturing Ledger"}
            </CardTitle>
            {selectedBuyer && (
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedOrderId("")
                    setIsPaymentDialogOpen(true)
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Payment
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedBuyer ? (
              <div className="text-center py-8 text-muted-foreground">Select a buyer to view their ledger</div>
            ) : (
              <PaymentHistory relatedId={selectedBuyer} relatedType="manufacturing" title="Complete Ledger" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        relatedId={selectedOrderId || selectedBuyer}
        relatedType="manufacturing"
        entityName={selectedBuyer}
        defaultDirection="incoming"
        maxAmount={
          selectedOrderId
            ? calculateOrderBalance(manufacturingOrders.find((o) => o.id === selectedOrderId)!)
            : undefined
        }
      />

      {/* New Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Manufacturing Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buyer-name" className="text-right">
                Buyer Name
              </Label>
              <Input
                id="buyer-name"
                value={newOrderBuyer}
                onChange={(e) => setNewOrderBuyer(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order-description" className="text-right">
                Description
              </Label>
              <Input
                id="order-description"
                value={newOrderDescription}
                onChange={(e) => setNewOrderDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order-total" className="text-right">
                Total Amount
              </Label>
              <Input
                id="order-total"
                type="number"
                min="0"
                step="0.01"
                value={newOrderTotal || ""}
                onChange={(e) => setNewOrderTotal(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddNewOrder}>
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Print Preview */}
      {selectedOrder && (
        <BillPrintPreview
          open={isPrintPreviewOpen}
          onOpenChange={setIsPrintPreviewOpen}
          invoiceId={selectedOrder.id}
          customerName={selectedOrder.buyerName}
          items={[
            {
              id: "1",
              name: selectedOrder.description,
              quantity: 1,
              price: selectedOrder.total,
              total: selectedOrder.total,
            },
          ]}
          total={selectedOrder.total}
          transactionType="order"
          status={selectedOrder.status}
          date={selectedOrder.date}
        />
      )}
    </div>
  )
}

