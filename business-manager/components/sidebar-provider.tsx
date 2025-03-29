"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type SidebarContextType = {
  isSidebarOpen: boolean
  toggleSidebar: (forceState?: boolean) => void
  isOpen: boolean
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check if we're on mobile on initial render
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }, [])

  const toggleSidebar = (forceState?: boolean) => {
    if (typeof forceState !== "undefined") {
      setIsSidebarOpen(forceState)
    } else {
      setIsSidebarOpen((prev) => !prev)
    }
  }

  // Only render children when mounted to avoid hydration issues
  if (!isMounted) {
    return null
  }

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, isOpen: isSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

