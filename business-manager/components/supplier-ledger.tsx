"use client"

import { useState, useEffect } from "react"
import { SearchIcon, FileTextIcon, PackageIcon, PlusIcon } from "lucide-react"
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
import { initialPurchases } from "@/lib/initial-data"

type Purchase = {
  id: string
  date: string
  vendor: string
  items: {
    name: string
    quantity: number
    price: number
  }[]
  status: "pending" | "received" | "cancelled"
  total: number
}

export function SupplierLedger() {
  const { toast } = useToast()
  const { currencySymbol } = useCurrencyStore()
  const { addLog } = useLogStore()
  const { getPaymentsByRelated } = usePaymentStore()

  const [purchases, setPurchases] = useLocalStorage<Purchase[]>("purchases", initialPurchases)

  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [vendorSearchQuery, setVendorSearchQuery] = useState("")
  const [filteredVendors, setFilteredVendors] = useState<string[]>([])
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState("")

  // Get unique vendors from purchases
  useEffect(() => {
    const uniqueVendors = [...new Set(purchases.map((purchase) => purchase.vendor))]

    // Filter vendors based on search query
    if (vendorSearchQuery) {
      setFilteredVendors(
        uniqueVendors.filter((vendor) => vendor.toLowerCase().includes(vendorSearchQuery.toLowerCase())),
      )
    } else {
      setFilteredVendors(uniqueVendors)
    }
  }, [purchases, vendorSearchQuery])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Supplier Ledger</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <PackageIcon className="h-5 w-5 mr-2" />
              Suppliers
            </CardTitle>
            <div className="relative mt-2">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                className="pl-8"
                value={vendorSearchQuery}
                onChange={(e) => setVendorSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No suppliers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor} className={selectedVendor === vendor ? "bg-accent" : ""}>
                        <TableCell>{vendor}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedVendor(vendor)}>
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
              {selectedVendor ? `Ledger for ${selectedVendor}` : "Supplier Ledger"}
            </CardTitle>
            {selectedVendor && (
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedPurchaseId("")
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
            {!selectedVendor ? (
              <div className="text-center py-8 text-muted-foreground">Select a supplier to view their ledger</div>
            ) : (
              <PaymentHistory relatedId={selectedVendor} relatedType="supplier" title="Complete Ledger" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        relatedId={selectedPurchaseId || selectedVendor}
        relatedType="supplier"
        entityName={selectedVendor}
        defaultDirection="outgoing"
      />
    </div>
  )
}

