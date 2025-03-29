// Dashboard data
export const initialData = {
  totalRevenue: 24580,
  revenueIncrease: 12.5,
  totalExpenses: 12450,
  expensesIncrease: 8.2,
  totalCustomers: 156,
  customersIncrease: 5.3,
  activeOrders: 23,
  ordersIncrease: 15.8,
  salesData: [
    { date: "Mar 1", amount: 1200 },
    { date: "Mar 5", amount: 1800 },
    { date: "Mar 10", amount: 1400 },
    { date: "Mar 15", amount: 2200 },
    { date: "Mar 20", amount: 1900 },
    { date: "Mar 25", amount: 2400 },
    { date: "Mar 30", amount: 2100 },
  ],
  recentTransactions: [
    {
      id: "tx1",
      type: "income",
      amount: 450,
      description: "Order #3245",
      date: "Today, 2:30 PM",
    },
    {
      id: "tx2",
      type: "expense",
      amount: 120,
      description: "Office supplies",
      date: "Today, 11:20 AM",
    },
    {
      id: "tx3",
      type: "income",
      amount: 850,
      description: "Order #3244",
      date: "Yesterday, 4:45 PM",
    },
    {
      id: "tx4",
      type: "expense",
      amount: 75,
      description: "Shipping costs",
      date: "Yesterday, 1:30 PM",
    },
    {
      id: "tx5",
      type: "income",
      amount: 350,
      description: "Order #3243",
      date: "Mar 28, 3:15 PM",
    },
  ],
  expenseCategories: [
    { name: "Supplies", value: 5200, color: "#4f46e5" },
    { name: "Utilities", value: 2100, color: "#06b6d4" },
    { name: "Rent", value: 3000, color: "#8b5cf6" },
    { name: "Salaries", value: 8500, color: "#ec4899" },
  ],
  topCustomers: [
    { name: "John Smith", email: "john@example.com", spent: 4250 },
    { name: "Sarah Johnson", email: "sarah@example.com", spent: 3800 },
    { name: "Michael Brown", email: "michael@example.com", spent: 3200 },
    { name: "Emily Davis", email: "emily@example.com", spent: 2900 },
  ],
  availableReports: [
    {
      title: "Monthly Sales Report",
      description: "Detailed breakdown of sales for the current month",
    },
    {
      title: "Expense Analysis",
      description: "Analysis of expenses by category",
    },
    {
      title: "Customer Activity",
      description: "Customer purchase history and activity",
    },
    {
      title: "Inventory Status",
      description: "Current inventory levels and reorder suggestions",
    },
    {
      title: "Profit & Loss",
      description: "Profit and loss statement for the selected period",
    },
    {
      title: "Tax Summary",
      description: "Summary of taxes collected and paid",
    },
  ],
}

// Transactions data
export const initialTransactions = [
  {
    id: "tx1001",
    date: "Mar 30, 2023",
    description: "Workshop services",
    type: "income",
    category: "Services",
    amount: 450,
  },
  {
    id: "tx1002",
    date: "Mar 29, 2023",
    description: "Office supplies",
    type: "expense",
    category: "Supplies",
    amount: 120,
  },
  {
    id: "tx1003",
    date: "Mar 28, 2023",
    description: "Custom fabrication",
    type: "income",
    category: "Sales",
    amount: 850,
  },
  {
    id: "tx1004",
    date: "Mar 27, 2023",
    description: "Electricity bill",
    type: "expense",
    category: "Utilities",
    amount: 210,
  },
  {
    id: "tx1005",
    date: "Mar 26, 2023",
    description: "Equipment repair",
    type: "income",
    category: "Services",
    amount: 350,
  },
  {
    id: "tx1006",
    date: "Mar 25, 2023",
    description: "Raw materials",
    type: "expense",
    category: "Supplies",
    amount: 580,
  },
  {
    id: "tx1007",
    date: "Mar 24, 2023",
    description: "Product sales",
    type: "income",
    category: "Sales",
    amount: 920,
  },
  {
    id: "tx1008",
    date: "Mar 23, 2023",
    description: "Employee salary",
    type: "expense",
    category: "Salaries",
    amount: 1500,
  },
]

// Customers data
export const initialCustomers = [
  {
    id: "cust1001",
    name: "John Smith",
    email: "john@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, CA 12345",
    totalSpent: 4250,
    lastPurchase: "Mar 25, 2023",
  },
  {
    id: "cust1002",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "(555) 234-5678",
    address: "456 Oak Ave, Somewhere, CA 12346",
    totalSpent: 3800,
    lastPurchase: "Mar 28, 2023",
  },
  {
    id: "cust1003",
    name: "Michael Brown",
    email: "michael@example.com",
    phone: "(555) 345-6789",
    address: "789 Pine St, Nowhere, CA 12347",
    totalSpent: 3200,
    lastPurchase: "Mar 20, 2023",
  },
  {
    id: "cust1004",
    name: "Emily Davis",
    email: "emily@example.com",
    phone: "(555) 456-7890",
    address: "101 Maple Dr, Elsewhere, CA 12348",
    totalSpent: 2900,
    lastPurchase: "Mar 15, 2023",
  },
  {
    id: "cust1005",
    name: "David Wilson",
    email: "david@example.com",
    phone: "(555) 567-8901",
    address: "202 Cedar Ln, Anywhere, CA 12349",
    totalSpent: 2450,
    lastPurchase: "Mar 10, 2023",
  },
]

// Orders data
export const initialOrders = [
  {
    id: "ORD-3245",
    date: "Mar 30, 2023",
    customer: "John Smith",
    status: "pending",
    items: [{ name: "Custom Table", quantity: 1, price: 450 }],
    total: 450,
  },
  {
    id: "ORD-3244",
    date: "Mar 28, 2023",
    customer: "Sarah Johnson",
    status: "processing",
    items: [
      { name: "Wooden Chairs", quantity: 4, price: 125 },
      { name: "Coffee Table", quantity: 1, price: 350 },
    ],
    total: 850,
  },
  {
    id: "ORD-3243",
    date: "Mar 25, 2023",
    customer: "Emily Davis",
    status: "completed",
    items: [{ name: "Bookshelf", quantity: 1, price: 350 }],
    total: 350,
  },
  {
    id: "ORD-3242",
    date: "Mar 20, 2023",
    customer: "Michael Brown",
    status: "completed",
    items: [
      { name: "Desk", quantity: 1, price: 550 },
      { name: "Desk Lamp", quantity: 1, price: 75 },
    ],
    total: 625,
  },
  {
    id: "ORD-3241",
    date: "Mar 15, 2023",
    customer: "David Wilson",
    status: "cancelled",
    items: [{ name: "Cabinet", quantity: 1, price: 400 }],
    total: 400,
  },
]

// Purchases data
export const initialPurchases = [
  {
    id: "PO-1245",
    date: "Mar 29, 2023",
    vendor: "Acme Supplies",
    status: "pending",
    items: [
      { name: "Wood Planks", quantity: 20, price: 15 },
      { name: "Screws (Box)", quantity: 5, price: 8 },
    ],
    total: 340,
  },
  {
    id: "PO-1244",
    date: "Mar 25, 2023",
    vendor: "Global Materials",
    status: "received",
    items: [
      { name: "Metal Brackets", quantity: 50, price: 2 },
      { name: "Paint (Gallon)", quantity: 3, price: 25 },
    ],
    total: 175,
  },
  {
    id: "PO-1243",
    date: "Mar 20, 2023",
    vendor: "Workshop Essentials",
    status: "received",
    items: [
      { name: "Sandpaper (Pack)", quantity: 10, price: 5 },
      { name: "Varnish (Quart)", quantity: 4, price: 12 },
    ],
    total: 98,
  },
  {
    id: "PO-1242",
    date: "Mar 15, 2023",
    vendor: "Tech Solutions",
    status: "cancelled",
    items: [{ name: "Power Tools", quantity: 2, price: 120 }],
    total: 240,
  },
  {
    id: "PO-1241",
    date: "Mar 10, 2023",
    vendor: "Quality Parts Inc.",
    status: "received",
    items: [
      { name: "Hinges", quantity: 30, price: 3 },
      { name: "Drawer Slides", quantity: 10, price: 8 },
    ],
    total: 170,
  },
]

