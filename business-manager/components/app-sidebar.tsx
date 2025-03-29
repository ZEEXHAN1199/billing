"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "./sidebar-provider"
import {
  LayoutDashboard,
  Users,
  Receipt,
  ClipboardList,
  Package,
  CreditCard,
  Settings,
  History,
  Save,
  FileText,
  FileSpreadsheet,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AppSidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isSidebarOpen } = useSidebar()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div
      className={cn(
        "h-full overflow-y-auto bg-background border-r transition-all duration-300",
        isSidebarOpen ? "w-64" : "w-16",
        className,
      )}
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link href="/" passHref>
              <Button
                variant={pathname === "/" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <LayoutDashboard className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Dashboard</span>}
              </Button>
            </Link>
            <Link href="/customers" passHref>
              <Button
                variant={pathname === "/customers" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <Users className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Customers</span>}
              </Button>
            </Link>
            <Link href="/billing" passHref>
              <Button
                variant={pathname === "/billing" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <Receipt className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Billing</span>}
              </Button>
            </Link>
            <Link href="/billing-history" passHref>
              <Button
                variant={pathname === "/billing-history" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <History className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Billing History</span>}
              </Button>
            </Link>
            <Link href="/inventory" passHref>
              <Button
                variant={pathname === "/inventory" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <Package className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Inventory</span>}
              </Button>
            </Link>
            <Link href="/orders" passHref>
              <Button
                variant={pathname === "/orders" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <ClipboardList className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Orders</span>}
              </Button>
            </Link>
            <Link href="/transactions" passHref>
              <Button
                variant={pathname === "/transactions" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <CreditCard className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Transactions</span>}
              </Button>
            </Link>
            <Link href="/ledger" passHref>
              <Button
                variant={pathname === "/ledger" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <FileText className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Ledger</span>}
              </Button>
            </Link>
            <Link href="/templates" passHref>
              <Button
                variant={pathname === "/templates" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <FileSpreadsheet className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Templates</span>}
              </Button>
            </Link>
            <Link href="/backup-restore" passHref>
              <Button
                variant={pathname === "/backup-restore" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <Save className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Backup & Restore</span>}
              </Button>
            </Link>
            <Link href="/settings" passHref>
              <Button
                variant={pathname === "/settings" ? "secondary" : "ghost"}
                className={cn("w-full justify-start", !isSidebarOpen && "justify-center px-0")}
              >
                <Settings className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "mr-0")} />
                {isSidebarOpen && <span>Settings</span>}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

