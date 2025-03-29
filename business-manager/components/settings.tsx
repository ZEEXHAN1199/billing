"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useTheme } from "next-themes"
import { DownloadIcon, UploadIcon } from "lucide-react"
import { useCompanyInfoStore } from "@/lib/stores/company-info-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { getAvailableBackups, restoreFromBackup } from "@/lib/services/auto-backup"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLogStore } from "@/lib/stores/log-store"

export function Settings() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { currencySymbol, setCurrencySymbol } = useCurrencyStore()
  const { companyInfo, updateCompanyInfo, setCompanyLogo } = useCompanyInfoStore()
  const { addLog } = useLogStore()

  const [businessSettings, setBusinessSettings] = useLocalStorage("business-settings", {
    name: "Zeeshan Engineering Works",
    address: "Near Alsaeed Chowk, Varat, Shahdara, Lahore.",
    phone: "923004827226, 923087860012",
    email: "zeeshanengineeringworks@gmail.com",
    taxRate: 7.5,
    currency: "RS",
  })

  const [notificationSettings, setNotificationSettings] = useLocalStorage("notification-settings", {
    emailNotifications: true,
    lowStockAlerts: true,
    paymentReminders: true,
    orderUpdates: true,
  })

  const [businessForm, setBusinessForm] = useState(businessSettings)
  const [backupData, setBackupData] = useState<string>("")
  const [companyForm, setCompanyForm] = useState(companyInfo)
  const [logoPreview, setLogoPreview] = useState<string | null>(companyInfo.logo || null)

  const [availableBackups, setAvailableBackups] = useState<Array<{ key: string; date: string }>>([])

  useEffect(() => {
    // Get available backups when the component mounts
    setAvailableBackups(getAvailableBackups())

    // Set up an interval to refresh the list
    const intervalId = setInterval(() => {
      setAvailableBackups(getAvailableBackups())
    }, 60000) // Refresh every minute

    return () => clearInterval(intervalId)
  }, [])

  const handleRestoreBackup = (backupKey: string) => {
    if (window.confirm("Are you sure you want to restore from this backup? Current data will be overwritten.")) {
      const success = restoreFromBackup(backupKey)

      if (success) {
        toast({
          title: "Backup restored",
          description: "Your data has been restored successfully. The page will refresh.",
        })

        // Add log
        addLog({
          action: "restore_backup",
          details: `Restored data from backup: ${backupKey}`,
          timestamp: new Date().toISOString(),
        })

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast({
          title: "Restore failed",
          description: "Failed to restore from backup.",
          variant: "destructive",
        })
      }
    }
  }

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBusinessSettings(businessForm)

    // Update currency symbol if changed
    if (businessForm.currency !== businessSettings.currency) {
      setCurrencySymbol(businessForm.currency)
    }

    toast({
      title: "Settings saved",
      description: "Your business settings have been updated",
    })
  }

  const handleCompanyInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Update company info
    updateCompanyInfo(companyForm)

    // Update logo if changed
    if (logoPreview && logoPreview !== companyInfo.logo) {
      setCompanyLogo(logoPreview)
    }

    toast({
      title: "Company info updated",
      description: "Your company information has been saved successfully",
    })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setLogoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCompanyInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setCompanyForm((prev) => ({
      ...prev,
      [id.replace("company-", "")]: value,
    }))
  }

  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    const updatedSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    }
    setNotificationSettings(updatedSettings)
    toast({
      title: "Notification settings updated",
      description: `${key} ${updatedSettings[key] ? "enabled" : "disabled"}`,
    })
  }

  const handleDataReset = () => {
    if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      localStorage.clear()
      toast({
        title: "Data reset",
        description: "All data has been reset. Refresh the page to see changes.",
      })
    }
  }

  const handleBackupData = () => {
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

    // Create a downloadable file
    const dataStr = JSON.stringify(data, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `workshop-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Backup created",
      description: "Your data has been backed up successfully",
    })
  }

  const handleRestoreData = () => {
    try {
      const data = JSON.parse(backupData)

      // Validate data structure
      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid backup data format")
      }

      // Clear existing data
      localStorage.clear()

      // Restore data
      Object.keys(data).forEach((key) => {
        localStorage.setItem(key, JSON.stringify(data[key]))
      })

      toast({
        title: "Data restored",
        description: "Your data has been restored successfully. Refresh the page to see changes.",
      })

      setBackupData("")
    } catch (error) {
      toast({
        title: "Restore failed",
        description: "Failed to restore data. Please check the backup file format.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details and preferences</CardDescription>
            </CardHeader>
            <form onSubmit={handleBusinessSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business Name</Label>
                    <Input
                      id="name"
                      value={businessForm.name}
                      onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={businessForm.email}
                      onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={businessForm.phone}
                      onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={businessForm.taxRate}
                      onChange={(e) => setBusinessForm({ ...businessForm, taxRate: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency Symbol</Label>
                    <Input
                      id="currency"
                      value={businessForm.currency}
                      onChange={(e) => setBusinessForm({ ...businessForm, currency: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Changes</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details for invoices and receipts</CardDescription>
            </CardHeader>
            <ScrollArea className="h-[60vh]">
              <form id="company-info-form" onSubmit={handleCompanyInfoSubmit}>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company-logo">Company Logo</Label>
                      <div className="flex items-center gap-4">
                        {logoPreview && (
                          <div className="relative w-16 h-16 border rounded overflow-hidden">
                            <Image
                              src={logoPreview || "/placeholder.svg"}
                              alt="Company logo preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}
                        <Input id="company-logo" type="file" accept="image/*" onChange={handleLogoChange} />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        value={companyForm.name}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter company name"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="company-quote">Company Quote/Intro</Label>
                      <Textarea
                        id="company-quote"
                        value={companyForm.quote}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter company quote or intro"
                        rows={2}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="company-address">Address</Label>
                      <Textarea
                        id="company-address"
                        value={companyForm.address}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter company address"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="company-phone1">Phone Number 1</Label>
                        <Input
                          id="company-phone1"
                          value={companyForm.phone1}
                          onChange={handleCompanyInputChange}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="company-phone2">Phone Number 2</Label>
                        <Input
                          id="company-phone2"
                          value={companyForm.phone2}
                          onChange={handleCompanyInputChange}
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="company-email">Email</Label>
                      <Input
                        id="company-email"
                        type="email"
                        value={companyForm.email}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter email address"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="company-site">Website</Label>
                      <Input
                        id="company-site"
                        value={companyForm.site}
                        onChange={handleCompanyInputChange}
                        placeholder="Enter website URL"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </form>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setTheme("light")}
                      >
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setTheme("dark")}
                      >
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setTheme("system")}
                      >
                        System
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationChange("emailNotifications")}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="low-stock">Low Stock Alerts</Label>
                <Switch
                  id="low-stock"
                  checked={notificationSettings.lowStockAlerts}
                  onCheckedChange={() => handleNotificationChange("lowStockAlerts")}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="payment-reminders">Payment Reminders</Label>
                <Switch
                  id="payment-reminders"
                  checked={notificationSettings.paymentReminders}
                  onCheckedChange={() => handleNotificationChange("paymentReminders")}
                />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="order-updates">Order Updates</Label>
                <Switch
                  id="order-updates"
                  checked={notificationSettings.orderUpdates}
                  onCheckedChange={() => handleNotificationChange("orderUpdates")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your application data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Backup Data</h3>
                <p className="text-sm text-muted-foreground">Download all your business data as a backup</p>
                <Button variant="outline" onClick={handleBackupData}>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export All Data
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Restore Data</h3>
                <p className="text-sm text-muted-foreground">Import data from a previous backup</p>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Paste your backup data here"
                    value={backupData}
                    onChange={(e) => setBackupData(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button variant="outline" onClick={handleRestoreData} disabled={!backupData}>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Restore Data
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Reset Data</h3>
                <p className="text-sm text-muted-foreground">
                  Reset all application data. This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={handleDataReset}>
                  Reset All Data
                </Button>
              </div>

              {/* Automatic Backups */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Automatic Backups</h3>
                <p className="text-sm text-muted-foreground">
                  The system automatically creates backups every 30 minutes. You can restore from these backups if
                  needed.
                </p>

                {availableBackups.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">No automatic backups available yet.</div>
                ) : (
                  <div className="border rounded-md">
                    <div className="max-h-[200px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableBackups.map((backup) => (
                            <TableRow key={backup.key}>
                              <TableCell>{backup.date}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => handleRestoreBackup(backup.key)}>
                                  Restore
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

