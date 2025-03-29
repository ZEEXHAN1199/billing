"use client"

import { useState, useEffect } from "react"
import { SearchIcon, FileTextIcon, ClipboardListIcon, PlusIcon } from "lucide-react"
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
import type { Order } from "@/lib/types"

export function OrderLedger() {
  const { toast } = useToast()
  const { currencySymbol } = useCurrencyStore()
  const { addLog } = useLogStore()
  const { getPaymentsByRelated } = usePaymentStore()

  const [orders, setOrders] = useLocalStorage<Order[]>("orders", [])

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [orderSearchQuery, setOrderSearchQuery] = useState("")
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  // Filter orders based on search
  useEffect(() => {
    if (orderSearchQuery) {
      setFilteredOrders(
        orders.filter(
          (order) =>
            order.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
            order.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredOrders(orders)
    }
  }, [orders, orderSearchQuery])

  const getOrderPayments = (orderId: string) => {
    return getPaymentsByRelated(orderId, "order")
  }

  const getTotalOrderPayments = (orderId: string) => {
    const payments = getOrderPayments(orderId)
    return payments.reduce((sum, payment) => {
      return payment.direction === "incoming" ? sum + payment.amount : sum - payment.amount
    }, 0)
  }

  const calculateOrderBalance = (order: Order) => {
    const totalPaid = getTotalOrderPayments(order.id)
    return order.total - totalPaid - order.discount
  }

  const getOrderStatus = (order: Order) => {
    const balance = calculateOrderBalance(order)
    if (balance <= 0) return "paid"
    if (balance < order.total) return "partial"
    return "unpaid"
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Order Ledger</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ClipboardListIcon className="h-5 w-5 mr-2" />
              Orders
            </CardTitle>
            <div className="relative mt-2">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-8"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className={selectedOrderId === order.id ? "bg-accent" : ""}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(order.id)}>
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
              {selectedOrderId ? `Ledger for Order ${selectedOrderId}` : "Order Ledger"}
            </CardTitle>
            {selectedOrderId && (
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Payment
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedOrderId ? (
              <div className="text-center py-8 text-muted-foreground">Select an order to view its ledger</div>
            ) : (
              <PaymentHistory relatedId={selectedOrderId} relatedType="order" title="Complete Ledger" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      {selectedOrderId && (
        <PaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          relatedId={selectedOrderId}
          relatedType="order"
          entityName={`Order ${selectedOrderId}`}
          defaultDirection="incoming"
          maxAmount={selectedOrderId ? calculateOrderBalance(orders.find((o) => o.id === selectedOrderId)!) : undefined}
        />
      )}
    </div>
  )
}

