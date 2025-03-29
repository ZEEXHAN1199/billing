"use client"

import { useState, useEffect } from "react"
import { PlusIcon, SearchIcon, FilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { PurchaseDialog } from "@/components/purchase-dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { initialPurchases } from "@/lib/initial-data"
import { cn } from "@/lib/utils"

// Import and use the currency store in purchase list
import { useCurrencyStore } from "@/lib/stores/currency-store"

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

export function PurchaseList() {
  const { toast } = useToast()
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>("purchases", initialPurchases)
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Add this inside the component:
  const { currencySymbol } = useCurrencyStore()

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Filter purchases based on search query and status filter
    let filtered = [...purchases]

    if (searchQuery) {
      filtered = filtered.filter(
        (purchase) =>
          purchase.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
          purchase.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((purchase) => purchase.status === statusFilter)
    }

    setFilteredPurchases(filtered)
  }, [purchases, searchQuery, statusFilter])

  const handleAddPurchase = (purchase: Omit<Purchase, "id">) => {
    const newPurchase = {
      ...purchase,
      id: `PO-RS{Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`,
    }

    setPurchases((prev) => [newPurchase, ...prev])
    toast({
      title: "Purchase added",
      description: "New purchase has been added successfully",
    })
    setIsDialogOpen(false)
  }

  const getStatusColor = (status: Purchase["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "received":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
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
        <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Purchase
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search purchases..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purchases</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purchase ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPurchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No purchases found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.id}</TableCell>
                  <TableCell>{purchase.date}</TableCell>
                  <TableCell>{purchase.vendor}</TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", getStatusColor(purchase.status))}>{purchase.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {currencySymbol}
                    {purchase.total.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PurchaseDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleAddPurchase} />
    </div>
  )
}

