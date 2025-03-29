"use client"

import { useState, useEffect } from "react"
import { SearchIcon, PrinterIcon, CheckCircle, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useBillingStore } from "@/lib/stores/billing-store"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useToast } from "@/components/ui/use-toast"
import type { Bill } from "@/lib/types"
import { useRouter } from "next/navigation"
import { BillPrintPreview } from "@/components/bill-print-preview"

export function BillingHistory() {
  const { toast } = useToast()
  const router = useRouter()
  const { currencySymbol } = useCurrencyStore()
  const { bills, updateBillStatus, deleteBill, loadBillToCart } = useBillingStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [dateSort, setDateSort] = useState("default")
  const [filteredBills, setFilteredBills] = useState<Bill[]>(bills)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)

  useEffect(() => {
    let filtered = [...bills]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (bill) =>
          bill.customerName.toLowerCase().includes(query) ||
          bill.id.toLowerCase().includes(query) ||
          bill.items.some((item) => item.name.toLowerCase().includes(query)),
      )
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((bill) => bill.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter((bill) => bill.date.split("T")[0] === dateFilter)
    }

    // Apply date sort
    if (dateSort && dateSort !== "default") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateSort === "asc" ? dateA - dateB : dateB - dateA
      })
    }

    setFilteredBills(filtered)
  }, [bills, searchQuery, statusFilter, dateFilter, dateSort])

  const handleMarkAsPaid = (bill: Bill) => {
    if (confirm(`Mark invoice ${bill.id} as paid?`)) {
      updateBillStatus(bill.id, "paid")

      toast({
        title: "Invoice updated",
        description: `Invoice ${bill.id} has been marked as paid`,
      })
    }
  }

  const handleDeleteBill = (bill: Bill) => {
    if (confirm(`Are you sure you want to delete invoice ${bill.id}? This will restore the inventory.`)) {
      deleteBill(bill.id)

      toast({
        title: "Invoice deleted",
        description: `Invoice ${bill.id} has been deleted and inventory restored`,
      })
    }
  }

  const handleEditBill = (bill: Bill) => {
    if (confirm(`Load invoice ${bill.id} into the cart for editing? Current cart will be cleared.`)) {
      loadBillToCart(bill.id)

      toast({
        title: "Invoice loaded",
        description: `Invoice ${bill.id} has been loaded into the cart for editing`,
      })

      router.push("/billing")
    }
  }

  const handlePrintBill = (bill: Bill) => {
    setSelectedBill(bill)
    setIsPrintPreviewOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>
      case "partial":
        return <Badge className="bg-yellow-500">Partial</Badge>
      case "unpaid":
        return <Badge className="bg-red-500">Unpaid</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Billing History</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer, invoice ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[150px]"
            />

            <Select value={dateSort} onValueChange={setDateSort}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total ({currencySymbol})</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No bills found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.id}</TableCell>
                      <TableCell>{bill.customerName}</TableCell>
                      <TableCell>
                        {bill.items.map((item) => (
                          <div key={item.id}>
                            {item.name} ({item.quantity})
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-right">{bill.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(bill.status)}</TableCell>
                      <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePrintBill(bill)}
                            title="Print Bill"
                          >
                            <PrinterIcon className="h-4 w-4" />
                          </Button>

                          <Button variant="outline" size="icon" onClick={() => handleEditBill(bill)} title="Edit Bill">
                            <Edit className="h-4 w-4" />
                          </Button>

                          {bill.status !== "paid" && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleMarkAsPaid(bill)}
                              title="Mark as Paid"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteBill(bill)}
                            title="Delete Bill"
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

      {/* Bill Print Preview */}
      {selectedBill && (
        <BillPrintPreview
          open={isPrintPreviewOpen}
          onOpenChange={setIsPrintPreviewOpen}
          invoiceId={selectedBill.id}
          customerName={selectedBill.customerName}
          items={selectedBill.items}
          total={selectedBill.total}
          existingBill={selectedBill}
        />
      )}
    </div>
  )
}

