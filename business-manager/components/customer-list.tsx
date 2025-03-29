"use client"

import { useState, useEffect } from "react"
import { PlusIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { CustomerDialog } from "@/components/customer-dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { initialCustomers } from "@/lib/initial-data"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useLogStore } from "@/lib/stores/log-store"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  totalSpent: number
  lastPurchase: string
}

export function CustomerList() {
  const { toast } = useToast()
  const { currencySymbol } = useCurrencyStore()
  const { addLog } = useLogStore()

  const [customers, setCustomers] = useLocalStorage<Customer[]>("customers", initialCustomers)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Filter customers based on search query
    if (searchQuery) {
      setFilteredCustomers(
        customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredCustomers(customers)
    }
  }, [customers, searchQuery])

  const handleAddCustomer = (customer: Omit<Customer, "id" | "totalSpent" | "lastPurchase">) => {
    const newCustomer = {
      ...customer,
      id: crypto.randomUUID(),
      totalSpent: 0,
      lastPurchase: "Never",
    }

    setCustomers((prev) => [...prev, newCustomer])

    // Add to log
    addLog({
      action: "add_customer",
      details: `Added new customer: RS{customer.name}`,
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Customer added",
      description: "New customer has been added successfully",
    })
    setIsDialogOpen(false)
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
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Last Purchase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.address}</TableCell>
                  <TableCell className="text-right">
                    {currencySymbol}
                    {customer.totalSpent.toLocaleString()}
                  </TableCell>
                  <TableCell>{customer.lastPurchase}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CustomerDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleAddCustomer} />
    </div>
  )
}

