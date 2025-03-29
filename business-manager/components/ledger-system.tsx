"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserIcon, ClipboardListIcon } from "lucide-react"
import { CustomerLedger } from "@/components/customer-ledger"
import { OrderLedger } from "@/components/order-ledger"

export function LedgerSystem() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Ledger System</h1>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="customers">
            <UserIcon className="h-4 w-4 mr-2" />
            Customer Ledger
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ClipboardListIcon className="h-4 w-4 mr-2" />
            Order Ledger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <CustomerLedger />
        </TabsContent>

        <TabsContent value="orders">
          <OrderLedger />
        </TabsContent>
      </Tabs>
    </div>
  )
}

