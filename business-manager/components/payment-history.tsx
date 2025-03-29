"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePaymentStore } from "@/lib/stores/payment-store"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useBillingStore } from "@/lib/stores/billing-store"
import { format } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon, FileTextIcon, CreditCardIcon, PrinterIcon, EyeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { BillPrintPreview } from "@/components/bill-print-preview"
import type { Order } from "@/lib/types"

// Unified transaction type that can represent both payments and bills/orders
type UnifiedTransaction = {
  id: string
  date: string
  amount: number
  type: "payment" | "bill" | "order"
  direction: "incoming" | "outgoing"
  method?: string
  reference?: string
  notes?: string
  status?: string
  relatedId?: string
  relatedType?: string
  customerName?: string
  items?: any[]
}

type PaymentHistoryProps = {
  relatedId?: string
  relatedType?: "customer" | "order"
  title?: string
  limit?: number
  showSummary?: boolean
}

export function PaymentHistory({
  relatedId,
  relatedType,
  title = "Payment History",
  limit,
  showSummary = true,
}: PaymentHistoryProps) {
  const { payments, getPaymentsByRelated } = usePaymentStore()
  const { bills } = useBillingStore()
  const { currencySymbol } = useCurrencyStore()
  const [orders] = useLocalStorage<Order[]>("orders", [])

  // State for print preview
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<UnifiedTransaction | null>(null)

  // Get all transactions (payments and bills/orders) based on filters
  const getUnifiedTransactions = (): UnifiedTransaction[] => {
    const transactions: UnifiedTransaction[] = []

    // Add payments
    const filteredPayments = relatedId && relatedType ? getPaymentsByRelated(relatedId, relatedType) : payments

    filteredPayments.forEach((payment) => {
      transactions.push({
        id: payment.id,
        date: payment.date,
        amount: payment.amount,
        type: "payment",
        direction: payment.direction,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
        relatedId: payment.relatedId,
        relatedType: payment.relatedType,
      })
    })

    // Add bills for customers
    if (relatedType === "customer") {
      const customerBills = relatedId ? bills.filter((bill) => bill.customerId === relatedId) : bills

      customerBills.forEach((bill) => {
        // For bills, "incoming" means money coming into the business (customer paid)
        // "outgoing" means money owed to the business (customer hasn't paid)
        const isPaid = bill.status === "paid"
        const isPartial = bill.status === "partial"

        transactions.push({
          id: bill.id,
          date: bill.date,
          amount: bill.total,
          type: "bill",
          // If paid, it's incoming (money received), otherwise it's outgoing (money owed)
          direction: isPaid ? "incoming" : "outgoing",
          status: bill.status,
          customerName: bill.customerName,
          notes: `Bill #${bill.id} - ${bill.items.length} items`,
          items: bill.items,
        })

        // If partially paid, add an entry for the paid amount
        if (isPartial && bill.amountPaid > 0) {
          transactions.push({
            id: `${bill.id}-paid`,
            date: bill.date,
            amount: bill.amountPaid,
            type: "payment",
            direction: "incoming",
            status: "paid",
            customerName: bill.customerName,
            notes: `Payment for Bill #${bill.id}`,
            relatedId: bill.id,
          })
        }
      })
    }

    // Add orders
    if (relatedType === "order") {
      const filteredOrders = relatedId ? orders.filter((order) => order.id === relatedId) : orders

      filteredOrders.forEach((order) => {
        // For orders, "incoming" means money coming into the business (customer paid)
        // "outgoing" means money owed to the business (customer hasn't paid)
        const isPaid = order.status === "completed"

        transactions.push({
          id: order.id,
          date: order.date,
          amount: order.total,
          type: "order",
          // If completed, assume it's paid (incoming), otherwise it's outgoing (money owed)
          direction: isPaid ? "incoming" : "outgoing",
          status: order.status,
          customerName: order.customerName,
          notes: `Order #${order.id} - ${order.items.length} items`,
          items: order.items,
        })
      })
    }

    return transactions
  }

  const transactions = getUnifiedTransactions()

  // Sort by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Apply limit if specified
  const displayTransactions = limit ? sortedTransactions.slice(0, limit) : sortedTransactions

  // Calculate summary
  const totalIncoming = transactions.reduce(
    (sum, transaction) => (transaction.direction === "incoming" ? sum + transaction.amount : sum),
    0,
  )

  const totalOutgoing = transactions.reduce(
    (sum, transaction) => (transaction.direction === "outgoing" ? sum + transaction.amount : sum),
    0,
  )

  const balance = totalIncoming - totalOutgoing

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash"
      case "bank":
        return "Bank Transfer"
      case "check":
        return "Check"
      case "online":
        return "Online"
      case "credit":
        return "Credit"
      default:
        return "Other"
    }
  }

  const getTransactionTypeIcon = (transaction: UnifiedTransaction) => {
    switch (transaction.type) {
      case "payment":
        return <CreditCardIcon className="h-3 w-3 mr-1" />
      case "bill":
      case "order":
        return <FileTextIcon className="h-3 w-3 mr-1" />
      default:
        return null
    }
  }

  const getTransactionTypeLabel = (transaction: UnifiedTransaction) => {
    switch (transaction.type) {
      case "payment":
        return "Payment"
      case "bill":
        return "Bill"
      case "order":
        return "Order"
      default:
        return "Transaction"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch (e) {
      return dateString
    }
  }

  const handleViewPrint = (transaction: UnifiedTransaction) => {
    setSelectedTransaction(transaction)
    setIsPrintPreviewOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {showSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Total Incoming</div>
                <div className="text-xl font-bold text-green-600">
                  {currencySymbol}
                  {totalIncoming.toFixed(2)}
                </div>
              </div>
              <div className="p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Total Outgoing</div>
                <div className="text-xl font-bold text-blue-600">
                  {currencySymbol}
                  {totalOutgoing.toFixed(2)}
                </div>
              </div>
              <div className="p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Balance</div>
                <div className={`text-xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {currencySymbol}
                  {balance.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No transaction history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayTransactions.map((transaction) => (
                    <TableRow key={`${transaction.type}-${transaction.id}`}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTransactionTypeIcon(transaction)}
                          {getTransactionTypeLabel(transaction)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.direction === "incoming" ? "default" : "secondary"}
                          className={cn(
                            transaction.direction === "incoming"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-blue-100 text-blue-800 hover:bg-blue-100",
                          )}
                        >
                          {transaction.direction === "incoming" ? (
                            <>
                              <ArrowUpIcon className="h-3 w-3 mr-1" /> Received
                            </>
                          ) : (
                            <>
                              <ArrowDownIcon className="h-3 w-3 mr-1" /> Owed
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {transaction.type === "payment" ? (
                          <>
                            {transaction.method && <div>{getPaymentMethodLabel(transaction.method)}</div>}
                            {transaction.reference && (
                              <div className="text-xs text-muted-foreground">Ref: {transaction.reference}</div>
                            )}
                            {transaction.notes && (
                              <div className="text-xs text-muted-foreground truncate">{transaction.notes}</div>
                            )}
                          </>
                        ) : (
                          <>
                            {transaction.customerName && <div>{transaction.customerName}</div>}
                            {transaction.notes && (
                              <div className="text-xs text-muted-foreground truncate">{transaction.notes}</div>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          transaction.direction === "incoming" ? "text-green-600" : "text-blue-600",
                        )}
                      >
                        {transaction.direction === "incoming" ? "+" : "-"}
                        {currencySymbol}
                        {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {transaction.status && (
                          <Badge
                            className={cn(
                              transaction.status === "paid" || transaction.status === "completed"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : transaction.status === "partial" || transaction.status === "processing"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  : "bg-red-100 text-red-800 hover:bg-red-100",
                            )}
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {(transaction.type === "bill" || transaction.type === "order") && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPrint(transaction)}
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewPrint(transaction)}
                              title="Print"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Print Preview Dialog */}
      {selectedTransaction && (
        <BillPrintPreview
          open={isPrintPreviewOpen}
          onOpenChange={setIsPrintPreviewOpen}
          invoiceId={selectedTransaction.id}
          customerName={selectedTransaction.customerName || ""}
          items={selectedTransaction.items || []}
          total={selectedTransaction.amount}
          transactionType={selectedTransaction.type}
          status={selectedTransaction.status}
          date={selectedTransaction.date}
        />
      )}
    </>
  )
}

