import type { PrintTemplate } from "@/components/template-manager"
import * as XLSX from "xlsx"

// Function to get templates from localStorage
export function getTemplates(): PrintTemplate[] {
  if (typeof window === "undefined") return []

  try {
    const templates = localStorage.getItem("print-templates")
    return templates ? JSON.parse(templates) : []
  } catch (error) {
    console.error("Error loading templates:", error)
    return []
  }
}

// Function to get a template by ID
export function getTemplateById(id: string): PrintTemplate | null {
  const templates = getTemplates()
  return templates.find((template) => template.id === id) || null
}

// Function to get templates by type
export function getTemplatesByType(type: PrintTemplate["type"]): PrintTemplate[] {
  const templates = getTemplates()
  return templates.filter((template) => template.type === type)
}

// Function to process a template with data
export function processTemplate(template: PrintTemplate, data: Record<string, any>): string {
  let processedContent = template.content

  // Replace placeholders with actual data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{${key}}`, "g")
    processedContent = processedContent.replace(placeholder, String(value))
  })

  return processedContent
}

// Function to export a processed template to Excel/CSV format
export function exportToExcel(content: string | any[][], filename: string) {
  try {
    let worksheet: XLSX.WorkSheet

    if (typeof content === "string") {
      // For text templates, create a simple one-cell spreadsheet
      worksheet = XLSX.utils.aoa_to_sheet([[content]])
    } else {
      // For Excel-like templates, use the grid data
      worksheet = XLSX.utils.aoa_to_sheet(content)
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template")

    // Generate Excel file
    XLSX.writeFile(workbook, `${filename}.xlsx`)

    return true
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    return false
  }
}

// Function to generate a template for a specific document type
export function generateTemplateData(type: PrintTemplate["type"], document: any): Record<string, any> {
  const data: Record<string, any> = {
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
  }

  switch (type) {
    case "bill":
      if (document) {
        data.invoice_id = document.id || ""
        data.customer_name = document.customerName || ""
        data.total = document.total || 0
        data.subtotal = document.subtotal || 0
        data.discount = document.discount || 0
        data.amount_paid = document.amountPaid || 0
        data.balance = document.balance || 0
        data.status = document.status || ""

        // Process items
        if (document.items && Array.isArray(document.items)) {
          document.items.forEach((item, index) => {
            data[`item_${index + 1}_name`] = item.name || ""
            data[`item_${index + 1}_quantity`] = item.quantity || 0
            data[`item_${index + 1}_price`] = item.price || 0
            data[`item_${index + 1}_total`] = item.total || 0
          })
          data.items_count = document.items.length
        }
      }
      break

    case "purchase":
      if (document) {
        data.purchase_id = document.id || ""
        data.vendor_name = document.vendor || ""
        data.total = document.total || 0
        data.status = document.status || ""

        // Process items
        if (document.items && Array.isArray(document.items)) {
          document.items.forEach((item, index) => {
            data[`item_${index + 1}_name`] = item.name || ""
            data[`item_${index + 1}_quantity`] = item.quantity || 0
            data[`item_${index + 1}_price`] = item.price || 0
            data[`item_${index + 1}_total`] = item.quantity * item.price || 0
          })
          data.items_count = document.items.length
        }
      }
      break

    case "order":
      if (document) {
        data.order_id = document.id || ""
        data.buyer_name = document.buyerName || ""
        data.description = document.description || ""
        data.total = document.total || 0
        data.status = document.status || ""
      }
      break

    case "payment":
      if (document) {
        data.payment_id = document.id || ""
        data.entity_name = document.entityName || ""
        data.amount = document.amount || 0
        data.direction = document.direction || ""
        data.notes = document.notes || ""
        data.related_document = document.relatedId || ""
      }
      break
  }

  return data
}

// Function to apply template data to Excel format
export function applyTemplateData(template: PrintTemplate, data: Record<string, any>): any[][] {
  if (template.format !== "excel" || !template.data) {
    return [[]]
  }

  try {
    // Deep clone the template data
    const templateData = JSON.parse(JSON.stringify(template.data))

    // Replace placeholders in each cell
    return templateData.map((row: any[]) => {
      return row.map((cell) => {
        if (typeof cell !== "string") return cell

        // Replace all placeholders in the cell
        let processedCell = cell
        Object.entries(data).forEach(([key, value]) => {
          const placeholder = new RegExp(`{${key}}`, "g")
          processedCell = processedCell.replace(placeholder, String(value))
        })

        return processedCell
      })
    })
  } catch (error) {
    console.error("Error applying template data:", error)
    return [[]]
  }
}

