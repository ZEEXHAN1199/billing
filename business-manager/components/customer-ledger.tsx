"use client"

import { useState, useEffect } from "react"
import { SearchIcon, FileTextIcon, UserIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useBillingStore } from "@/lib/stores/billing-store"
import { useCustomerStore } from "@/lib/stores/customer-store"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useLogStore } from "@/lib/stores/log-store"
import { usePaymentStore } from "@/lib/stores/payment-store"
import { PaymentDialog } from "@/components/payment-dialog"
import { PaymentHistory } from "@/components/payment-history"

export function CustomerLedger() {
  const { toast } = useToast()
  const { currencySymbol } = useCurrencyStore()
  const { addLog } = useLogStore()
  const { customers } = useCustomerStore()
  const { bills } = useBillingStore()
  const { getPaymentsByRelated } = usePaymentStore()

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState(customers)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedBillId, setSelectedBillId] = useState("")

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

  const getSelectedCustomerName = () => {
    return customers.find((c) => c.id === selectedCustomerId)?.name || ""
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Customer Ledger</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Customers
            </CardTitle>
            <div className="relative mt-2">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-8"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id} className={selectedCustomerId === customer.id ? "bg-accent" : ""}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomerId(customer.id)}>
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
              {selectedCustomerId ? `Ledger for ${getSelectedCustomerName()}` : "Customer Ledger"}
            </CardTitle>
            {selectedCustomerId && (
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedBillId("")
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
            {!selectedCustomerId ? (
              <div className="text-center py-8 text-muted-foreground">Select a customer to view their ledger</div>
            ) : (
              <PaymentHistory relatedId={selectedCustomerId} relatedType="customer" title="Complete Ledger" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      {selectedCustomerId && (
        <PaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          relatedId={selectedBillId || selectedCustomerId}
          relatedType="customer"
          entityName={getSelectedCustomerName()}
          defaultDirection="incoming"
        />
      )}
    </div>
  )
}

