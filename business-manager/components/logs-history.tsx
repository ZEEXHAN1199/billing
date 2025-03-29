"use client"

import { useState, useEffect } from "react"
import { SearchIcon, DownloadIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useLogStore } from "@/lib/stores/log-store"
import { format } from "date-fns"

export function LogsHistory() {
  const { toast } = useToast()
  const { logs, clearLogs, addLog } = useLogStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredLogs, setFilteredLogs] = useState(logs)

  useEffect(() => {
    // Filter logs based on search query
    if (searchQuery) {
      setFilteredLogs(
        logs.filter(
          (log) =>
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.details.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredLogs(logs)
    }
  }, [logs, searchQuery])

  const handleExportLogs = () => {
    const logsJson = JSON.stringify(logs, null, 2)
    const blob = new Blob([logsJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `logs-export-${format(new Date(), "yyyy-MM-dd")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addLog({
      action: "export_logs",
      details: "Exported logs to JSON file",
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Logs exported",
      description: "Logs have been exported successfully",
    })
  }

  const handleClearLogs = () => {
    if (confirm("Are you sure you want to clear all logs? This action cannot be undone.")) {
      clearLogs()

      // Add a new log entry about clearing logs
      addLog({
        action: "clear_logs",
        details: "All logs have been cleared",
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Logs cleared",
        description: "All logs have been cleared successfully",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>System Logs</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleExportLogs}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export Logs
            </Button>
            <Button variant="destructive" onClick={handleClearLogs}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="capitalize">{log.action.replace(/_/g, " ")}</TableCell>
                      <TableCell>{log.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

