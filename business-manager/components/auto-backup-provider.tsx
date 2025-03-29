"use client"

import type React from "react"

import { useAutoBackup } from "@/lib/services/auto-backup"

interface AutoBackupProviderProps {
  children: React.ReactNode
  intervalMinutes?: number
}

export function AutoBackupProvider({ children, intervalMinutes = 30 }: AutoBackupProviderProps) {
  // Initialize the auto-backup service
  useAutoBackup(intervalMinutes)

  // Just render children, this component only sets up the backup service
  return <>{children}</>
}

