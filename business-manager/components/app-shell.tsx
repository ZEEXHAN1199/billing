"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useSidebar } from "@/components/sidebar-provider"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, isOpen: isSidebarOpen } = useSidebar()
  const [isOnline, setIsOnline] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check if we're on mobile on initial render and when window resizes
    const checkIfMobile = () => {
      setIsOnline(navigator.onLine)
    }

    // Set initial state
    checkIfMobile()

    // Add event listeners for online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex min-h-screen">
      <div
        className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-0 md:w-16"}`}
      >
        <AppSidebar />
      </div>
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0 md:ml-16"}`}>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 sticky top-0 z-20">
          <Button variant="ghost" size="icon" onClick={() => toggleSidebar()} aria-label="Toggle sidebar">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          <div className="flex-1">
            {!isOnline && (
              <div className="text-sm font-medium text-amber-500">Offline Mode - Changes will be saved locally</div>
            )}
          </div>
          <ModeToggle />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

