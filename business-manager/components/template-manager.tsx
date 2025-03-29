"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/components/ui/use-toast"
import { useLogStore } from "@/lib/stores/log-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileIcon,
  PlusIcon,
  Trash2Icon,
  DownloadIcon,
  UploadIcon,
  FileTextIcon,
  EditIcon,
  FileSpreadsheetIcon,
  GridIcon,
  LayoutIcon,
  TextIcon,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TemplateEditor } from "@/components/template-editor"
import { Switch } from "@/components/ui/switch"
import * as XLSX from "xlsx"

export type PrintTemplate = {
  id: string
  name: string
  type: "bill" | "purchase" | "order" | "payment" | "other"
  content: string
  dateCreated: string
  dateModified: string
  format: "text" | "excel" | "html"
  paperSize: "A4" | "A5" | "Letter"
  orientation: "portrait" | "landscape"
  data?: any[][]
}

export function TemplateManager() {
  const { toast } = useToast()
  const { addLog } = useLogStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useLocalStorage<PrintTemplate[]>("print-templates", [])
  const [activeTab, setActiveTab] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [editorMode, setEditorMode] = useState<"text" | "excel" | "html">("excel")
  const [showGridLines, setShowGridLines] = useState(true)
  const [paperSize, setPaperSize] = useState<"A4" | "A5" | "Letter">("A4")
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")

  // New template form state
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateType, setNewTemplateType] = useState<PrintTemplate["type"]>("bill")
  const [newTemplateContent, setNewTemplateContent] = useState("")
  const [newTemplateData, setNewTemplateData] = useState<any[][]>([
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
  ])

  // Edit template form state
  const [editTemplateName, setEditTemplateName] = useState("")
  const [editTemplateType, setEditTemplateType] = useState<PrintTemplate["type"]>("bill")
  const [editTemplateContent, setEditTemplateContent] = useState("")
  const [editTemplateData, setEditTemplateData] = useState<any[][]>([])

  // Filter templates based on active tab and search query
  const filteredTemplates = templates.filter((template) => {
    const matchesTab = activeTab === "all" || template.type === activeTab
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please provide a name for the template",
        variant: "destructive",
      })
      return
    }

    const newTemplate: PrintTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      type: newTemplateType,
      content: editorMode === "text" ? newTemplateContent : JSON.stringify(newTemplateData),
      dateCreated: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      format: editorMode,
      paperSize,
      orientation,
      data: editorMode === "excel" ? newTemplateData : undefined,
    }

    setTemplates([...templates, newTemplate])

    // Add log
    addLog({
      action: "template_created",
      details: `Created new ${newTemplateType} template: ${newTemplateName}`,
      timestamp: new Date().toISOString(),
    })

    // Reset form
    setNewTemplateName("")
    setNewTemplateType("bill")
    setNewTemplateContent("")
    setNewTemplateData([
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
    ])
    setIsAddDialogOpen(false)

    toast({
      title: "Template created",
      description: "Your template has been created successfully",
    })
  }

  const handleEditTemplate = () => {
    if (!selectedTemplate) return

    if (!editTemplateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please provide a name for the template",
        variant: "destructive",
      })
      return
    }

    const updatedTemplates = templates.map((template) => {
      if (template.id === selectedTemplate.id) {
        return {
          ...template,
          name: editTemplateName,
          type: editTemplateType,
          content: editorMode === "text" ? editTemplateContent : JSON.stringify(editTemplateData),
          dateModified: new Date().toISOString(),
          format: editorMode,
          paperSize,
          orientation,
          data: editorMode === "excel" ? editTemplateData : undefined,
        }
      }
      return template
    })

    setTemplates(updatedTemplates)

    // Add log
    addLog({
      action: "template_updated",
      details: `Updated ${editTemplateType} template: ${editTemplateName}`,
      timestamp: new Date().toISOString(),
    })

    setIsEditDialogOpen(false)

    toast({
      title: "Template updated",
      description: "Your template has been updated successfully",
    })
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      const templateToDelete = templates.find((t) => t.id === templateId)

      const updatedTemplates = templates.filter((template) => template.id !== templateId)
      setTemplates(updatedTemplates)

      // Add log
      if (templateToDelete) {
        addLog({
          action: "template_deleted",
          details: `Deleted ${templateToDelete.type} template: ${templateToDelete.name}`,
          timestamp: new Date().toISOString(),
        })
      }

      toast({
        title: "Template deleted",
        description: "The template has been deleted successfully",
      })
    }
  }

  const handleExportTemplate = (template: PrintTemplate) => {
    const templateData = JSON.stringify(template, null, 2)
    const blob = new Blob([templateData], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `${template.name.replace(/\s+/g, "-").toLowerCase()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Template exported",
      description: "The template has been exported successfully",
    })
  }

  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split(".").pop()?.toLowerCase()

    if (fileExt === "json") {
      // Handle JSON template import
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importedTemplate = JSON.parse(content) as PrintTemplate

          // Check if the imported template has the required fields
          if (!importedTemplate.id || !importedTemplate.name || !importedTemplate.type || !importedTemplate.content) {
            throw new Error("Invalid template format")
          }

          // Check if a template with the same ID already exists
          const existingTemplateIndex = templates.findIndex((t) => t.id === importedTemplate.id)

          if (existingTemplateIndex >= 0) {
            // Update existing template
            const updatedTemplates = [...templates]
            updatedTemplates[existingTemplateIndex] = {
              ...importedTemplate,
              dateModified: new Date().toISOString(),
            }
            setTemplates(updatedTemplates)
          } else {
            // Add new template
            setTemplates([
              ...templates,
              {
                ...importedTemplate,
                id: `template-${Date.now()}`, // Generate a new ID to avoid conflicts
                dateCreated: new Date().toISOString(),
                dateModified: new Date().toISOString(),
              },
            ])
          }

          toast({
            title: "Template imported",
            description: "The template has been imported successfully",
          })

          // Add log
          addLog({
            action: "template_imported",
            details: `Imported ${importedTemplate.type} template: ${importedTemplate.name}`,
            timestamp: new Date().toISOString(),
          })
        } catch (error) {
          console.error("Error importing template:", error)
          toast({
            title: "Import failed",
            description: "Failed to import template. Please check the file format.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    } else if (fileExt === "xlsx" || fileExt === "xls") {
      // Handle Excel file import
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })

          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[worksheetName]

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

          // Create a new template with this data
          setNewTemplateName(file.name.split(".")[0])
          setNewTemplateType("bill")
          setNewTemplateData(jsonData)
          setEditorMode("excel")
          setIsAddDialogOpen(true)

          toast({
            title: "Excel file loaded",
            description: "The Excel file has been loaded. Please review and save as a template.",
          })
        } catch (error) {
          console.error("Error importing Excel file:", error)
          toast({
            title: "Import failed",
            description: "Failed to import Excel file. Please check the file format.",
            variant: "destructive",
          })
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      toast({
        title: "Unsupported file format",
        description: "Please upload a JSON or Excel file.",
        variant: "destructive",
      })
    }

    event.target.value = "" // Reset the input
  }

  const handleEditClick = (template: PrintTemplate) => {
    setSelectedTemplate(template)
    setEditTemplateName(template.name)
    setEditTemplateType(template.type)
    setEditorMode(template.format || "text")
    setPaperSize(template.paperSize || "A4")
    setOrientation(template.orientation || "portrait")

    if (template.format === "excel" && template.data) {
      setEditTemplateData(template.data)
    } else if (template.format === "excel" && template.content) {
      try {
        setEditTemplateData(JSON.parse(template.content))
      } catch (e) {
        setEditTemplateData([
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
        ])
      }
    } else {
      setEditTemplateContent(template.content)
    }

    setIsEditDialogOpen(true)
  }

  const handlePreviewClick = (template: PrintTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  const getTemplateTypeLabel = (type: PrintTemplate["type"]) => {
    switch (type) {
      case "bill":
        return "Invoice/Bill"
      case "purchase":
        return "Purchase Order"
      case "order":
        return "Manufacturing Order"
      case "payment":
        return "Payment Receipt"
      case "other":
        return "Other"
      default:
        return type
    }
  }

  const handleExportToExcel = (template: PrintTemplate) => {
    try {
      let data: any[][]

      if (template.format === "excel" && template.data) {
        data = template.data
      } else if (template.format === "excel" && template.content) {
        data = JSON.parse(template.content)
      } else {
        // For text templates, create a simple one-cell spreadsheet with the content
        data = [[template.content]]
      }

      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Template")

      // Generate Excel file
      XLSX.writeFile(wb, `${template.name.replace(/\s+/g, "-").toLowerCase()}.xlsx`)

      toast({
        title: "Excel file exported",
        description: "The template has been exported as an Excel file.",
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Export failed",
        description: "Failed to export template to Excel.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Print Templates</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Template
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon className="h-4 w-4 mr-2" />
            Import
            <input
              type="file"
              id="import-template"
              ref={fileInputRef}
              className="hidden"
              accept=".json,.xlsx,.xls"
              onChange={handleImportTemplate}
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <FileTextIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="bill">Invoices/Bills</TabsTrigger>
            <TabsTrigger value="purchase">Purchase Orders</TabsTrigger>
            <TabsTrigger value="order">Manufacturing Orders</TabsTrigger>
            <TabsTrigger value="payment">Payment Receipts</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-6">
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No templates found. Click "Add Template" to create one.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Paper Size</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>{getTemplateTypeLabel(template.type)}</TableCell>
                          <TableCell>
                            {template.format === "excel" ? (
                              <div className="flex items-center">
                                <FileSpreadsheetIcon className="h-4 w-4 mr-1" />
                                Excel
                              </div>
                            ) : template.format === "html" ? (
                              <div className="flex items-center">
                                <LayoutIcon className="h-4 w-4 mr-1" />
                                HTML
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <TextIcon className="h-4 w-4 mr-1" />
                                Text
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {template.paperSize || "A4"} ({template.orientation || "portrait"})
                          </TableCell>
                          <TableCell>{new Date(template.dateModified).toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePreviewClick(template)}
                                title="Preview"
                              >
                                <FileIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(template)}
                                title="Edit"
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleExportToExcel(template)}
                                title="Export to Excel"
                              >
                                <FileSpreadsheetIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleExportTemplate(template)}
                                title="Export as JSON"
                              >
                                <DownloadIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTemplate(template.id)}
                                title="Delete"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Template Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Template</DialogTitle>
            <DialogDescription>Create a new template for printing documents</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={newTemplateType}
                  onValueChange={(value) => setNewTemplateType(value as PrintTemplate["type"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill">Invoice/Bill</SelectItem>
                    <SelectItem value="purchase">Purchase Order</SelectItem>
                    <SelectItem value="order">Manufacturing Order</SelectItem>
                    <SelectItem value="payment">Payment Receipt</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Editor Type</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={editorMode === "excel" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorMode("excel")}
                    className="flex-1"
                  >
                    <GridIcon className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    variant={editorMode === "text" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorMode("text")}
                    className="flex-1"
                  >
                    <TextIcon className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select value={paperSize} onValueChange={(value) => setPaperSize(value as "A4" | "A5" | "Letter")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Orientation</Label>
                <Select
                  value={orientation}
                  onValueChange={(value) => setOrientation(value as "portrait" | "landscape")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="show-grid" checked={showGridLines} onCheckedChange={setShowGridLines} />
                <Label htmlFor="show-grid">Show Grid Lines</Label>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Template Content</Label>
              {editorMode === "text" ? (
                <Textarea
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  className="font-mono h-[500px]"
                  placeholder="Enter your template content here..."
                />
              ) : (
                <div className="border rounded-md h-[500px] overflow-auto">
                  <TemplateEditor
                    data={newTemplateData}
                    onChange={setNewTemplateData}
                    showGridLines={showGridLines}
                    paperSize={paperSize}
                    orientation={orientation}
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Use placeholders like {"{customer_name}"}, {"{date}"}, {"{total}"}, etc. for dynamic content.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTemplate}>Create Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>Modify your template</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-template-name">Template Name</Label>
                <Input
                  id="edit-template-name"
                  value={editTemplateName}
                  onChange={(e) => setEditTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-template-type">Template Type</Label>
                <Select
                  value={editTemplateType}
                  onValueChange={(value) => setEditTemplateType(value as PrintTemplate["type"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill">Invoice/Bill</SelectItem>
                    <SelectItem value="purchase">Purchase Order</SelectItem>
                    <SelectItem value="order">Manufacturing Order</SelectItem>
                    <SelectItem value="payment">Payment Receipt</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Editor Type</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={editorMode === "excel" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorMode("excel")}
                    className="flex-1"
                  >
                    <GridIcon className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    variant={editorMode === "text" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorMode("text")}
                    className="flex-1"
                  >
                    <TextIcon className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select value={paperSize} onValueChange={(value) => setPaperSize(value as "A4" | "A5" | "Letter")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Orientation</Label>
                <Select
                  value={orientation}
                  onValueChange={(value) => setOrientation(value as "portrait" | "landscape")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="edit-show-grid" checked={showGridLines} onCheckedChange={setShowGridLines} />
                <Label htmlFor="edit-show-grid">Show Grid Lines</Label>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Template Content</Label>
              {editorMode === "text" ? (
                <Textarea
                  value={editTemplateContent}
                  onChange={(e) => setEditTemplateContent(e.target.value)}
                  className="font-mono h-[500px]"
                  placeholder="Enter your template content here..."
                />
              ) : (
                <div className="border rounded-md h-[500px] overflow-auto">
                  <TemplateEditor
                    data={editTemplateData}
                    onChange={setEditTemplateData}
                    showGridLines={showGridLines}
                    paperSize={paperSize}
                    orientation={orientation}
                  />
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Use placeholders like {"{customer_name}"}, {"{date}"}, {"{total}"}, etc. for dynamic content.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTemplate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh]">
            {selectedTemplate?.format === "excel" ? (
              <div
                className={`p-4 border rounded-md ${paperSize === "A4" ? "w-[210mm]" : paperSize === "A5" ? "w-[148mm]" : "w-[216mm]"} mx-auto`}
              >
                <TemplateEditor
                  data={selectedTemplate.data || []}
                  readOnly={true}
                  showGridLines={showGridLines}
                  paperSize={selectedTemplate.paperSize || "A4"}
                  orientation={selectedTemplate.orientation || "portrait"}
                />
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
                <pre className="whitespace-pre-wrap font-mono text-sm">{selectedTemplate?.content}</pre>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

