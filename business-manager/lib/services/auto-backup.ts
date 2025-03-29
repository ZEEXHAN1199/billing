"use client"

import { useEffect, useRef } from "react"
import { useLogStore } from "@/lib/stores/log-store"

// Function to collect all data from localStorage
const collectAllData = () => {
  const data = {}

  // Get all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          data[key] = JSON.parse(value)
        }
      } catch (error) {
        console.error(`Error parsing ${key}:`, error)
      }
    }
  }

  return data
}

// Function to save backup to localStorage
const saveBackup = (data: any) => {
  const timestamp = new Date().toISOString()
  const backupKey = `system_backup_${timestamp}`

  try {
    localStorage.setItem(backupKey, JSON.stringify(data))

    // Keep only the last 5 backups
    const backupKeys = Object.keys(localStorage)
      .filter((key) => key.startsWith("system_backup_"))
      .sort()
      .reverse()

    if (backupKeys.length > 5) {
      backupKeys.slice(5).forEach((key) => {
        localStorage.removeItem(key)
      })
    }

    return backupKey
  } catch (error) {
    console.error("Error saving backup:", error)
    return null
  }
}

// Hook to run auto-backup
export const useAutoBackup = (intervalMinutes = 30) => {
  const { addLog } = useLogStore()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Function to perform backup
    const performBackup = () => {
      try {
        const allData = collectAllData()
        const backupKey = saveBackup(allData)

        if (backupKey) {
          addLog({
            action: "auto_backup",
            details: `Automatic backup created: ${backupKey}`,
            timestamp: new Date().toISOString(),
          })
          console.log(`Auto-backup completed: ${backupKey}`)
        }
      } catch (error) {
        console.error("Auto-backup failed:", error)
      }
    }

    // Set up the interval
    timerRef.current = setInterval(performBackup, intervalMinutes * 60 * 1000)

    // Run an initial backup
    performBackup()

    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [addLog, intervalMinutes])

  return null
}

// Function to restore from a backup
export const restoreFromBackup = (backupKey: string) => {
  try {
    const backupData = localStorage.getItem(backupKey)
    if (!backupData) {
      throw new Error("Backup not found")
    }

    const data = JSON.parse(backupData)

    // Restore each item to localStorage
    Object.entries(data).forEach(([key, value]) => {
      if (key !== backupKey && !key.startsWith("system_backup_")) {
        localStorage.setItem(key, JSON.stringify(value))
      }
    })

    return true
  } catch (error) {
    console.error("Error restoring from backup:", error)
    return false
  }
}

// Function to get all available backups
export const getAvailableBackups = () => {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith("system_backup_"))
    .sort()
    .reverse()
    .map((key) => {
      const timestamp = key.replace("system_backup_", "")
      return {
        key,
        timestamp,
        date: new Date(timestamp).toLocaleString(),
      }
    })
}

