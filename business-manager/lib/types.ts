// Customer types
export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  totalSpent: number
  lastPurchase: string
}

// Product types
export type Product = {
  id: string
  name: string
  description?: string // Added description field
  price: number
  quantity: number
}

// Invoice/Bill types
export type BillItem = {
  id: string
  name: string
  description?: string // Added description field
  quantity: number
  price: number
  total: number
}

export type Bill = {
  id: string
  customerId: string
  customerName: string
  date: string
  items: BillItem[]
  subtotal: number
  discount: number
  total: number
  amountPaid: number
  balance: number
  status: "paid" | "partial" | "unpaid"
  autoId?: string
}

// Order types
export type Order = {
  id: string
  customerId: string
  customerName: string
  date: string
  items: BillItem[]
  subtotal: number
  discount: number
  total: number
  amountPaid: number
  balance: number
  status: "pending" | "processing" | "completed" | "cancelled"
}

// Company info type
export type CompanyInfo = {
  logo: string
  name: string
  quote: string
  address: string
  phone1: string
  phone2: string
  email: string
  site: string
  proprietor: string
}

// Log entry type
export type LogEntry = {
  action: string
  details: string
  timestamp: string
}

// Dashboard stats type
export type DashboardStats = {
  totalRevenue: number
  totalTransactions: number
  totalProducts: number
  totalCustomers: number
  revenueByDate: Record<string, number>
  lowStockProducts: Product[]
}

