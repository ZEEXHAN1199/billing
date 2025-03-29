"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { SearchIcon, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useCustomerStore } from "@/lib/stores/customer-store"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useLogStore } from "@/lib/stores/log-store"
import type { Customer } from "@/lib/types"

export function CustomerManagement() {
  const { toast } = useToast()
  const { currencySymbol } = useCurrencyStore()
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomerStore()
  const { addLog } = useLogStore()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers)
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)

  useEffect(() => {
    // Filter customers based on search query
    if (searchQuery) {
      setFilteredCustomers(
        customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery),
        ),
      )
    } else {
      setFilteredCustomers(customers)
    }
  }, [customers, searchQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phone) {
      toast({
        title: "Missing information",
        description: "Please provide at least a name and phone number",
        variant: "destructive",
      })
      return
    }

    if (editingCustomerId) {
      // Update existing customer
      updateCustomer(editingCustomerId, { name, phone, email, address })

      addLog({
        action: "update_customer",
        details: `Updated customer: ${name}`,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Customer updated",
        description: "Customer has been updated successfully",
      })
    } else {
      // Add new customer
      addCustomer({ name, phone, email, address })

      addLog({
        action: "add_customer",
        details: `Added new customer: ${name}`,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Customer added",
        description: "New customer has been added successfully",
      })
    }

    // Reset form
    setName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setEditingCustomerId(null)
  }

  const handleEdit = (customer: Customer) => {
    setName(customer.name)
    setPhone(customer.phone)
    setEmail(customer.email)
    setAddress(customer.address)
    setEditingCustomerId(customer.id)
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
      deleteCustomer(id)

      addLog({
        action: "delete_customer",
        details: `Deleted customer: ${name}`,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Customer deleted",
        description: "Customer has been deleted successfully",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add/Edit Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input placeholder="Customer Name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>

            <Button type="submit">{editingCustomerId ? "Update Customer" : "Add Customer"}</Button>

            {editingCustomerId && (
              <Button
                type="button"
                variant="outline"
                className="ml-2"
                onClick={() => {
                  setName("")
                  setPhone("")
                  setEmail("")
                  setAddress("")
                  setEditingCustomerId(null)
                }}
              >
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Customer List</CardTitle>
          <div className="relative w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell className="text-right">
                        {currencySymbol}
                        {customer.totalSpent.toLocaleString()}
                      </TableCell>
                      <TableCell>{customer.lastPurchase}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(customer)}
                            title="Edit Customer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(customer.id, customer.name)}
                            title="Delete Customer"
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
    </div>
  )
}

