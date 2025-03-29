"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Users, ShoppingCart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { RecentTransactions } from "@/components/recent-transactions"
import { SalesChart } from "@/components/sales-chart"
import { ExpensesChart } from "@/components/expenses-chart"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { initialData } from "@/lib/initial-data"

export function Dashboard() {
  const { toast } = useToast()
  const [data, setData] = useLocalStorage("dashboard-data", initialData)
  const [isLoading, setIsLoading] = useState(true)
  const currencySymbol = "RS" // You can make this configurable

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleDataReset = () => {
    setData(initialData)
    toast({
      title: "Data reset",
      description: "Dashboard data has been reset to initial values",
    })
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
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button variant="outline" onClick={handleDataReset}>
          Reset Demo Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currencySymbol}
                  {data.totalRevenue.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className="flex items-center text-emerald-500">
                    <ArrowUpIcon className="mr-1 h-3 w-3" />
                    {data.revenueIncrease}%
                  </span>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currencySymbol}
                  {data.totalExpenses.toLocaleString()}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className="flex items-center text-rose-500">
                    <ArrowDownIcon className="mr-1 h-3 w-3" />
                    {data.expensesIncrease}%
                  </span>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalCustomers}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className="flex items-center text-emerald-500">
                    <ArrowUpIcon className="mr-1 h-3 w-3" />
                    {data.customersIncrease}%
                  </span>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.activeOrders}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span className="flex items-center text-emerald-500">
                    <ArrowUpIcon className="mr-1 h-3 w-3" />
                    {data.ordersIncrease}%
                  </span>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Daily revenue for the current month</CardDescription>
              </CardHeader>
              <CardContent>
                <SalesChart data={data.salesData} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activities</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions transactions={data.recentTransactions} currencySymbol={currencySymbol} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ExpensesChart data={data.expenseCategories} />
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Customers with highest purchase value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                      <div className="font-medium">
                        {currencySymbol}
                        {customer.spent.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>Generate and download business reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.availableReports.map((report, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{report.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </CardContent>
                    <div className="px-4 pb-4">
                      <Button variant="outline" size="sm" className="w-full">
                        Generate
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

