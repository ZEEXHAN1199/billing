"use client"

import type React from "react"

import { useState } from "react"
import { DownloadIcon, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useLogStore } from "@/lib/stores/log-store"
import { useCustomerStore } from "@/lib/stores/customer-store"
import { useInventoryStore } from "@/lib/stores/inventory-store"
import { useBillingStore } from "@/lib/stores/billing-store"
import { useCompanyInfoStore } from "@/lib/stores/company-info-store"

export function BackupRestore() {
  const { toast } = useToast()
  const { addLog } = useLogStore()
  const [backupName, setBackupName] = useState(`backup-${new Date().toISOString().split("T")[0]}`)

  const handleExportJSON = () => {
    // Collect all data from stores
    const data = {
      customers: useCustomerStore.getState().customers,
      products: useInventoryStore.getState().products,
      bills: useBillingStore.getState().bills,
      invoiceCounter: useBillingStore.getState().invoiceCounter,
      logs: useLogStore.getState().logs,
      companyInfo: useCompanyInfoStore.getState().companyInfo,
    }

    // Create a downloadable file
    const dataStr = JSON.stringify(data, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `${backupName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addLog({
      action: "export_data",
      details: `Exported data as JSON: ${backupName}.json`,
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Data exported",
      description: "Your data has been exported successfully",
    })
  }

  const handleExportCSV = () => {
    const customers = useCustomerStore.getState().customers
    const products = useInventoryStore.getState().products
    const bills = useBillingStore.getState().bills

    // Create CSV for customers
    let customersCSV = "id,name,email,phone,address,totalSpent,lastPurchase\n"
    customers.forEach((c) => {
      customersCSV += `${c.id},"${c.name}","${c.email}","${c.phone}","${c.address.replace(/"/g, '""')}",${c.totalSpent},"${c.lastPurchase}"\n`
    })

    // Create CSV for products
    let productsCSV = "id,name,price,quantity\n"
    products.forEach((p) => {
      productsCSV += `${p.id},"${p.name}",${p.price},${p.quantity}\n`
    })

    // Create CSV for bills (simplified)
    let billsCSV = "id,customerId,customerName,date,total,status\n"
    bills.forEach((b) => {
      billsCSV += `${b.id},"${b.customerId}","${b.customerName}","${b.date}",${b.total},"${b.status}"\n`
    })

    // Combine all CSVs
    const combinedCSV = "CUSTOMERS\n" + customersCSV + "\nPRODUCTS\n" + productsCSV + "\nBILLS\n" + billsCSV

    // Create a downloadable file
    const blob = new Blob([combinedCSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `${backupName}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addLog({
      action: "export_data",
      details: `Exported data as CSV: ${backupName}.csv`,
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Data exported as CSV",
      description: "Your data has been exported as CSV successfully",
    })
  }

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string
        const data = JSON.parse(result)

        // Validate data structure
        if (!data.customers || !data.products || !data.bills) {
          throw new Error("Invalid backup file format")
        }

        // Confirm before restoring
        if (confirm("This will replace all your current data. Are you sure you want to continue?")) {
          // Restore data to stores
          const customerStore = useCustomerStore.getState()
          customerStore.customers = data.customers

          const inventoryStore = useInventoryStore.getState()
          inventoryStore.products = data.products

          const billingStore = useBillingStore.getState()
          billingStore.bills = data.bills
          billingStore.invoiceCounter = data.invoiceCounter || 1

          if (data.companyInfo) {
            const companyInfoStore = useCompanyInfoStore.getState()
            companyInfoStore.updateCompanyInfo(data.companyInfo)
          }

          addLog({
            action: "restore_data",
            details: `Restored data from backup file: ${file.name}`,
            timestamp: new Date().toISOString(),
          })

          toast({
            title: "Data restored",
            description: "Your data has been restored successfully",
          })

          // Reload the page to reflect changes
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
      } catch (error) {
        console.error("Error restoring data:", error)
        toast({
          title: "Restore failed",
          description: "The backup file is invalid or corrupted",
          variant: "destructive",
        })
      }
    }

    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Backup Data</CardTitle>
          <CardDescription>Export your data for safekeeping</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Backup File Name</label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="Enter backup name"
              />
            </div>
            <Button onClick={handleExportJSON}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restore Data</CardTitle>
          <CardDescription>Restore your data from a backup file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center p-4 border rounded-md bg-yellow-50 text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">
                Warning: Restoring data will replace all your current data. Make sure to backup your current data first.
              </p>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Select Backup File</label>
                <Input type="file" accept=".json" onChange={handleRestore} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

