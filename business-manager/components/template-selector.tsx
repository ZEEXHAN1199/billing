"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { FileIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { PrintTemplate } from "@/components/template-manager"
import {
  getTemplatesByType,
  getTemplateById,
  processTemplate,
  exportToExcel,
  generateTemplateData,
} from "@/lib/services/template-service"

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentType: PrintTemplate["type"]
  documentData: any
  entityName: string
}

export function TemplateSelector({
  open,
  onOpenChange,
  documentType,
  documentData,
  entityName,
}: TemplateSelectorProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<PrintTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")

  useEffect(() => {
    if (open) {
      // Load templates when dialog opens
      const availableTemplates = getTemplatesByType(documentType)
      setTemplates(availableTemplates)

      // Select the first template by default if available
      if (availableTemplates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(availableTemplates[0].id)
      }
    }
  }, [open, documentType, selectedTemplateId])

  const handlePrint = () => {
    if (!selectedTemplateId) {
      toast({
        title: "No template selected",
        description: "Please select a template to continue",
        variant: "destructive",
      })
      return
    }

    const template = getTemplateById(selectedTemplateId)
    if (!template) {
      toast({
        title: "Template not found",
        description: "The selected template could not be found",
        variant: "destructive",
      })
      return
    }

    try {
      // Generate data for the template
      const data = generateTemplateData(documentType, documentData)

      // Process the template with the data
      const processedContent = processTemplate(template, data)

      // Export to Excel/CSV
      const filename = `${documentType}_${entityName}_${new Date().toISOString().split("T")[0]}`
      exportToExcel(processedContent, filename)

      toast({
        title: "Export successful",
        description: "Your document has been exported successfully",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error processing template:", error)
      toast({
        title: "Export failed",
        description: "Failed to process the template. Please check the template format.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Print Template</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {templates.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No templates available for this document type. Please create a template first.
            </div>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template-select" className="text-right">
                Template
              </Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint} disabled={templates.length === 0 || !selectedTemplateId}>
            <FileIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

