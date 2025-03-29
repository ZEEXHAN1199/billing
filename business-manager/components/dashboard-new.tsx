"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBillingStore } from "@/lib/stores/billing-store"
import { useCustomerStore } from "@/lib/stores/customer-store"
import { useInventoryStore } from "@/lib/stores/inventory-store"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { AlertTriangle } from "lucide-react"
import type { DashboardStats, Product } from "@/lib/types"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export function DashboardNew() {
  const { currencySymbol } = useCurrencyStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalTransactions: 0,
    totalProducts: 0,
    totalCustomers: 0,
    revenueByDate: {},
    lowStockProducts: [],
  })

  useEffect(() => {
    // Calculate dashboard stats
    const bills = useBillingStore.getState().bills
    const customers = useCustomerStore.getState().customers
    const products = useInventoryStore.getState().products

    // Calculate total revenue
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.total, 0)

    // Calculate revenue by date
    const revenueByDate: Record<string, number> = {}
    bills.forEach((bill) => {
      const date = bill.date.split("T")[0]
      revenueByDate[date] = (revenueByDate[date] || 0) + bill.total
    })

    // Get low stock products
    const lowStockProducts = products.filter((p) => p.quantity < 5)

    setStats({
      totalRevenue,
      totalTransactions: bills.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      revenueByDate,
      lowStockProducts,
    })
  }, [])

  // Prepare chart data
  const prepareChartData = () => {
    // Sort dates for the chart
    const sortedDates = Object.keys(stats.revenueByDate).sort()
    const revenueData = sortedDates.map((date) => stats.revenueByDate[date])

    return {
      labels: sortedDates,
      datasets: [
        {
          label: `Revenue (${currencySymbol})`,
          data: revenueData,
          borderColor: "rgb(53, 162, 235)",
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          tension: 0.3,
        },
      ],
    }
  }

  // Prepare product quantity chart data
  const prepareProductQuantityData = () => {
    const products = useInventoryStore.getState().products
    const sortedProducts = [...products].sort((a, b) => a.quantity - b.quantity).slice(0, 10)

    return {
      labels: sortedProducts.map((p) => p.name),
      datasets: [
        {
          label: "Quantity",
          data: sortedProducts.map((p) => p.quantity),
          backgroundColor: sortedProducts.map((p) =>
            p.quantity < 5 ? "rgba(255, 99, 132, 0.5)" : "rgba(75, 192, 192, 0.5)",
          ),
          borderColor: sortedProducts.map((p) => (p.quantity < 5 ? "rgb(255, 99, 132)" : "rgb(75, 192, 192)")),
          borderWidth: 1,
        },
      ],
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencySymbol}
              {stats.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {Object.keys(stats.revenueByDate).length > 0 ? (
                <Line
                  data={prepareChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No revenue data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Inventory Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar
                data={prepareProductQuantityData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.lowStockProducts.length === 0 ? (
            <div className="text-center py-4 text-green-600">All products have sufficient stock levels.</div>
          ) : (
            <div className="space-y-2">
              {stats.lowStockProducts.map((product: Product) => (
                <div key={product.id} className="flex items-center p-3 border rounded-md bg-yellow-50">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <span className="font-medium">{product.name}</span> is low on stock - only{" "}
                    <span className="font-bold text-yellow-700">{product.quantity}</span> units remaining!
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

