"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid,
  Save,
  Upload,
  Download,
  Plus,
  Trash2,
  FileText,
  FileSpreadsheet,
  Printer,
  ImageIcon,
  MoveHorizontal,
  Copy,
  Clipboard,
  Undo2,
  Redo2,
  Search,
  Palette,
  Square,
  RotateCcw,
  Layers,
  Merge,
  Split,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Input as ColorInput } from "@/components/ui/input"
import * as XLSX from "xlsx"

// Define paper sizes in mm
const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  LETTER: { width: 216, height: 279 },
  LEGAL: { width: 216, height: 356 },
}

// Define template categories
const TEMPLATE_CATEGORIES = ["invoice", "receipt", "order", "quote", "report", "letter", "custom"]

// Define cell types
type CellValue = {
  value: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: "left" | "center" | "right"
  isPlaceholder?: boolean
  backgroundColor?: string
  textColor?: string
  fontSize?: number
  borderTop?: boolean
  borderRight?: boolean
  borderBottom?: boolean
  borderLeft?: boolean
}

type MergedCell = {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

type TemplateData = {
  id: string
  name: string
  type: string
  category: string
  paperSize: keyof typeof PAPER_SIZES
  orientation: "portrait" | "landscape"
  cells: Record<string, CellValue>
  mergedCells: MergedCell[]
  rowCount: number
  colCount: number
  companyLogo?: string
  zoom: number
  lastModified: number
  createdAt: number
}

// For undo/redo functionality
type HistoryAction = {
  type: "cell_update" | "merge" | "unmerge" | "add_row" | "add_column" | "import" | "clear" | "move"
  data: any
  timestamp: number
}

export function ExcelTemplateEditor() {
  const { toast } = useToast()
  const [templates, setTemplates] = useLocalStorage<TemplateData[]>("excel-templates", [])
  const [activeTemplate, setActiveTemplate] = useState<TemplateData | null>(null)
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [selectionStart, setSelectionStart] = useState<string | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null)
  const [showGridLines, setShowGridLines] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const [draggedCell, setDraggedCell] = useState<string | null>(null)
  const [dragTarget, setDragTarget] = useState<string | null>(null)
  const [clipboard, setClipboard] = useState<{ cells: Record<string, CellValue>; startCell: string } | null>(null)
  const [isXlsDialogOpen, setIsXlsDialogOpen] = useState(false)
  const [xlsData, setXlsData] = useState<any[][]>([])
  const [xlsSheets, setXlsSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>("")
  const [isMergingCells, setIsMergingCells] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateData[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [history, setHistory] = useState<HistoryAction[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [cellBackgroundColor, setCellBackgroundColor] = useState("#ffffff")
  const [cellTextColor, setCellTextColor] = useState("#000000")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showBorderControls, setShowBorderControls] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const xlsInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Filter templates based on search query and category
  useEffect(() => {
    if (!templates) return

    let filtered = [...templates]

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => t.category === categoryFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((t) => t.name.toLowerCase().includes(query) || t.type.toLowerCase().includes(query))
    }

    setFilteredTemplates(filtered)
  }, [templates, searchQuery, categoryFilter])

  // Auto-save functionality
  useEffect(() => {
    if (!isAutoSaveEnabled || !activeTemplate) return

    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set a new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      saveTemplate(true)
    }, 30000) // Auto-save after 30 seconds of inactivity

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [activeTemplate, isAutoSaveEnabled])

  // Initialize with a default template if none exists
  useEffect(() => {
    if (!templates || templates.length === 0) {
      const defaultTemplate: TemplateData = {
        id: crypto.randomUUID(),
        name: "Default Invoice Template",
        type: "invoice",
        category: "invoice",
        paperSize: "A4",
        orientation: "portrait",
        cells: {
          A1: { value: "ZEESHAN ENGINEERING WORKS", bold: true, align: "center" },
          A2: { value: "We deals in all kind of shoe machinery.", align: "center" },
          A3: { value: "Near Alsaeed Chowk, Varat, Shahdara, Lahore.", align: "center" },
          A4: { value: "Ph# 923004827226", align: "center" },

          A6: { value: "Date:", bold: true, align: "left" },
          B6: { value: "Friday, 4 February 2022" },

          A7: { value: "BILL#:", bold: true },

          A8: { value: "STATUS:", bold: true },

          A10: { value: "CUSTOMER:", bold: true },

          A11: { value: "CUSTOMER ID:", bold: true },

          A13: { value: "Item#", bold: true, borderBottom: true, borderTop: true },
          B13: { value: "QTY", bold: true, align: "center", borderBottom: true, borderTop: true },
          C13: { value: "PRICE", bold: true, align: "right", borderBottom: true, borderTop: true },

          A18: { value: "TOTAL", bold: true, align: "right" },

          A20: { value: "GRAND TOTAL", bold: true, align: "right" },

          A22: { value: "FB Page: www.facebook.com/zew226", align: "left" },
          A23: { value: "Email: zew4827226@gmail.com", align: "left" },
          A24: { value: "ph# 923087860012", align: "left" },
        },
        mergedCells: [
          { startRow: 0, startCol: 0, endRow: 0, endCol: 5 },
          { startRow: 1, startCol: 0, endRow: 1, endCol: 5 },
          { startRow: 2, startCol: 0, endRow: 2, endCol: 5 },
          { startRow: 3, startCol: 0, endRow: 3, endCol: 5 },
        ],
        rowCount: 25,
        colCount: 8,
        zoom: 100,
        lastModified: Date.now(),
        createdAt: Date.now(),
      }
      setTemplates([defaultTemplate])
      setActiveTemplate(defaultTemplate)
    } else if (!activeTemplate && templates.length > 0) {
      setActiveTemplate(templates[0])
    }
  }, [templates, activeTemplate, setTemplates])

  // Generate column headers (A, B, C, ...)
  const getColumnHeader = (index: number) => {
    let header = ""
    while (index >= 0) {
      header = String.fromCharCode(65 + (index % 26)) + header
      index = Math.floor(index / 26) - 1
    }
    return header
  }

  // Get cell coordinates from ID (e.g., "A1" -> {col: 0, row: 0})
  const getCellCoords = (cellId: string) => {
    const colStr = cellId.match(/[A-Z]+/)?.[0] || ""
    const rowStr = cellId.match(/\d+/)?.[0] || ""

    let col = 0
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + (colStr.charCodeAt(i) - 64)
    }
    col -= 1 // 0-based index

    const row = Number.parseInt(rowStr) - 1 // 0-based index

    return { col, row }
  }

  // Get cell ID from coordinates (e.g., {col: 0, row: 0} -> "A1")
  const getCellId = (col: number, row: number) => {
    return `${getColumnHeader(col)}${row + 1}`
  }

  // Check if a cell is part of a merged cell
  const isCellMerged = (cellId: string) => {
    if (!activeTemplate) return false

    const { row, col } = getCellCoords(cellId)

    for (const mergedCell of activeTemplate.mergedCells) {
      if (
        row >= mergedCell.startRow &&
        row <= mergedCell.endRow &&
        col >= mergedCell.startCol &&
        col <= mergedCell.endCol
      ) {
        return true
      }
    }

    return false
  }

  // Check if a cell is the top-left cell of a merged cell
  const isMergeOrigin = (cellId: string) => {
    if (!activeTemplate) return false

    const { row, col } = getCellCoords(cellId)

    for (const mergedCell of activeTemplate.mergedCells) {
      if (row === mergedCell.startRow && col === mergedCell.startCol) {
        return true
      }
    }

    return false
  }

  // Get merged cell dimensions
  const getMergedCellDimensions = (cellId: string) => {
    if (!activeTemplate) return { rowSpan: 1, colSpan: 1 }

    const { row, col } = getCellCoords(cellId)

    for (const mergedCell of activeTemplate.mergedCells) {
      if (row === mergedCell.startRow && col === mergedCell.startCol) {
        return {
          rowSpan: mergedCell.endRow - mergedCell.startRow + 1,
          colSpan: mergedCell.endCol - mergedCell.startCol + 1,
        }
      }
    }

    return { rowSpan: 1, colSpan: 1 }
  }

  // Get cell value
  const getCellValue = (cellId: string): CellValue => {
    if (!activeTemplate) return { value: "" }

    // If this cell is part of a merged cell but not the origin, return empty
    if (isCellMerged(cellId) && !isMergeOrigin(cellId)) {
      return { value: "" }
    }

    return activeTemplate.cells[cellId] || { value: "" }
  }

  // Add action to history
  const addToHistory = (action: Omit<HistoryAction, "timestamp">) => {
    // If we're not at the end of the history, truncate it
    const newHistory = history.slice(0, historyIndex + 1)

    // Add the new action
    newHistory.push({
      ...action,
      timestamp: Date.now(),
    })

    // Update history and index
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Update cell value with history tracking
  const updateCellValue = (cellId: string, newValue: Partial<CellValue>) => {
    if (!activeTemplate) return

    const currentValue = getCellValue(cellId)

    // Add to history before making the change
    addToHistory({
      type: "cell_update",
      data: {
        cellId,
        oldValue: currentValue,
        newValue,
      },
    })

    const updatedValue = { ...currentValue, ...newValue }

    setActiveTemplate({
      ...activeTemplate,
      cells: {
        ...activeTemplate.cells,
        [cellId]: updatedValue,
      },
      lastModified: Date.now(),
    })
  }

  // Undo last action
  const undo = () => {
    if (historyIndex < 0 || !activeTemplate) return

    const action = history[historyIndex]

    switch (action.type) {
      case "cell_update":
        const { cellId, oldValue } = action.data
        setActiveTemplate({
          ...activeTemplate,
          cells: {
            ...activeTemplate.cells,
            [cellId]: oldValue,
          },
          lastModified: Date.now(),
        })
        break

      case "merge":
        const { mergedCell } = action.data
        setActiveTemplate({
          ...activeTemplate,
          mergedCells: activeTemplate.mergedCells.filter(
            (mc) =>
              !(
                mc.startRow === mergedCell.startRow &&
                mc.startCol === mergedCell.startCol &&
                mc.endRow === mergedCell.endRow &&
                mc.endCol === mergedCell.endCol
              ),
          ),
          lastModified: Date.now(),
        })
        break

      case "unmerge":
        setActiveTemplate({
          ...activeTemplate,
          mergedCells: [...activeTemplate.mergedCells, action.data.mergedCell],
          lastModified: Date.now(),
        })
        break

      // Add more cases for other action types
    }

    setHistoryIndex(historyIndex - 1)
  }

  // Redo last undone action
  const redo = () => {
    if (historyIndex >= history.length - 1 || !activeTemplate) return

    const action = history[historyIndex + 1]

    switch (action.type) {
      case "cell_update":
        const { cellId, newValue } = action.data
        const currentValue = getCellValue(cellId)
        setActiveTemplate({
          ...activeTemplate,
          cells: {
            ...activeTemplate.cells,
            [cellId]: { ...currentValue, ...newValue },
          },
          lastModified: Date.now(),
        })
        break

      case "merge":
        setActiveTemplate({
          ...activeTemplate,
          mergedCells: [...activeTemplate.mergedCells, action.data.mergedCell],
          lastModified: Date.now(),
        })
        break

      case "unmerge":
        const { mergedCell } = action.data
        setActiveTemplate({
          ...activeTemplate,
          mergedCells: activeTemplate.mergedCells.filter(
            (mc) =>
              !(
                mc.startRow === mergedCell.startRow &&
                mc.startCol === mergedCell.startCol &&
                mc.endRow === mergedCell.endRow &&
                mc.endCol === mergedCell.endCol
              ),
          ),
          lastModified: Date.now(),
        })
        break

      // Add more cases for other action types
    }

    setHistoryIndex(historyIndex + 1)
  }

  // Save the current template
  const saveTemplate = (isAutoSave = false) => {
    if (!activeTemplate) return

    const updatedTemplates = templates.map((t) =>
      t.id === activeTemplate.id
        ? {
            ...activeTemplate,
            lastModified: Date.now(),
          }
        : t,
    )

    setTemplates(updatedTemplates)
    setLastSaved(new Date())

    if (!isAutoSave) {
      toast({
        title: "Template saved",
        description: `Template "${activeTemplate.name}" has been saved successfully.`,
      })
    }
  }

  // Create a new template
  const createNewTemplate = () => {
    const newTemplate: TemplateData = {
      id: crypto.randomUUID(),
      name: "New Template",
      type: "custom",
      category: "custom",
      paperSize: "A4",
      orientation: "portrait",
      cells: {},
      mergedCells: [],
      rowCount: 20,
      colCount: 8,
      zoom: 100,
      lastModified: Date.now(),
      createdAt: Date.now(),
    }

    setTemplates([...templates, newTemplate])
    setActiveTemplate(newTemplate)

    toast({
      title: "New template created",
      description: "You can now start editing your new template.",
    })
  }

  // Duplicate the current template
  const duplicateTemplate = () => {
    if (!activeTemplate) return

    const duplicatedTemplate: TemplateData = {
      ...activeTemplate,
      id: crypto.randomUUID(),
      name: `${activeTemplate.name} (Copy)`,
      lastModified: Date.now(),
      createdAt: Date.now(),
    }

    setTemplates([...templates, duplicatedTemplate])
    setActiveTemplate(duplicatedTemplate)

    toast({
      title: "Template duplicated",
      description: `A copy of "${activeTemplate.name}" has been created.`,
    })
  }

  // Delete the current template
  const deleteTemplate = () => {
    if (!activeTemplate) return

    if (templates.length <= 1) {
      toast({
        title: "Cannot delete template",
        description: "You must have at least one template.",
        variant: "destructive",
      })
      return
    }

    const updatedTemplates = templates.filter((t) => t.id !== activeTemplate.id)
    setTemplates(updatedTemplates)
    setActiveTemplate(updatedTemplates[0])

    toast({
      title: "Template deleted",
      description: `Template "${activeTemplate.name}" has been deleted.`,
    })
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    // Read the Excel file
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Get the sheet names
        const sheetNames = workbook.SheetNames
        setXlsSheets(sheetNames)

        if (sheetNames.length > 0) {
          setSelectedSheet(sheetNames[0])

          // Get the first worksheet
          const worksheet = workbook.Sheets[sheetNames[0]]

          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
          setXlsData(jsonData)

          // Open the XLS dialog
          setIsXlsDialogOpen(true)
        }

        setIsUploading(false)
      } catch (error) {
        console.error("Error reading Excel file:", error)
        toast({
          title: "Error",
          description: "Failed to read Excel file. Please try again.",
          variant: "destructive",
        })
        setIsUploading(false)
      }
    }

    reader.readAsArrayBuffer(file)
  }

  // Import XLS data to template
  const importXlsData = () => {
    if (!activeTemplate || xlsData.length === 0) return

    // Store the current state for undo
    const oldCells = { ...activeTemplate.cells }

    // Create new cells from XLS data
    const newCells: Record<string, CellValue> = {}

    xlsData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell !== null && cell !== undefined) {
          const cellId = getCellId(colIndex, rowIndex)
          newCells[cellId] = {
            value: String(cell),
            align: "left",
          }
        }
      })
    })

    // Add to history
    addToHistory({
      type: "import",
      data: {
        oldCells,
        newCells,
      },
    })

    // Update template
    setActiveTemplate({
      ...activeTemplate,
      cells: newCells,
      rowCount: Math.max(activeTemplate.rowCount, xlsData.length),
      colCount: Math.max(activeTemplate.colCount, ...xlsData.map((row) => row.length)),
      lastModified: Date.now(),
    })

    setIsXlsDialogOpen(false)

    toast({
      title: "XLS data imported",
      description: "The Excel data has been imported into your template.",
    })
  }

  // Change XLS sheet
  const changeXlsSheet = (sheetName: string) => {
    if (!xlsInputRef.current?.files?.[0]) return

    setSelectedSheet(sheetName)

    // Read the Excel file again for the selected sheet
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })

        // Get the selected worksheet
        const worksheet = workbook.Sheets[sheetName]

        // Convert to array of arrays
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        setXlsData(jsonData)
      } catch (error) {
        console.error("Error reading Excel sheet:", error)
      }
    }

    reader.readAsArrayBuffer(xlsInputRef.current.files[0])
  }

  // Add placeholder to cell
  const addPlaceholder = (placeholder: string) => {
    if (!selectedCell || !activeTemplate) return

    updateCellValue(selectedCell, {
      value: placeholder,
      isPlaceholder: true,
    })
  }

  // Add row to template
  const addRow = () => {
    if (!activeTemplate) return

    // Add to history
    addToHistory({
      type: "add_row",
      data: {
        oldRowCount: activeTemplate.rowCount,
      },
    })

    setActiveTemplate({
      ...activeTemplate,
      rowCount: activeTemplate.rowCount + 1,
      lastModified: Date.now(),
    })

    toast({
      title: "Row added",
      description: `Added row ${activeTemplate.rowCount + 1}`,
    })
  }

  // Add column to template
  const addColumn = () => {
    if (!activeTemplate) return

    // Add to history
    addToHistory({
      type: "add_column",
      data: {
        oldColCount: activeTemplate.colCount,
      },
    })

    setActiveTemplate({
      ...activeTemplate,
      colCount: activeTemplate.colCount + 1,
      lastModified: Date.now(),
    })

    toast({
      title: "Column added",
      description: `Added column ${getColumnHeader(activeTemplate.colCount)}`,
    })
  }

  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoUrl(e.target?.result as string)
    }

    reader.readAsDataURL(file)
  }

  // Save logo to template
  const saveLogoToTemplate = () => {
    if (!activeTemplate) return

    // Store old logo for undo
    const oldLogo = activeTemplate.companyLogo

    // Add to history
    addToHistory({
      type: "cell_update",
      data: {
        property: "companyLogo",
        oldValue: oldLogo,
        newValue: logoUrl,
      },
    })

    setActiveTemplate({
      ...activeTemplate,
      companyLogo: logoUrl,
      lastModified: Date.now(),
    })

    setIsLogoDialogOpen(false)

    toast({
      title: "Logo added",
      description: "Company logo has been added to the template.",
    })
  }

  // Handle cell selection for merging
  const handleCellMouseDown = (cellId: string, event: React.MouseEvent) => {
    // Prevent default to avoid text selection
    event.preventDefault()

    if (isMergingCells) {
      setSelectionStart(cellId)
      setSelectionEnd(cellId)
    } else if (isDragging) {
      setDraggedCell(cellId)
    } else {
      setSelectedCell(cellId)
    }
  }

  const handleCellMouseEnter = (cellId: string) => {
    if (isMergingCells && selectionStart) {
      setSelectionEnd(cellId)
    } else if (isDragging && draggedCell) {
      setDragTarget(cellId)
    }
  }

  const handleCellMouseUp = () => {
    if (isMergingCells && selectionStart && selectionEnd) {
      mergeCells(selectionStart, selectionEnd)
      setSelectionStart(null)
      setSelectionEnd(null)
      setIsMergingCells(false)
    } else if (isDragging && draggedCell && dragTarget) {
      moveCellContent(draggedCell, dragTarget)
      setDraggedCell(null)
      setDragTarget(null)
      setIsDragging(false)
    }
  }

  // Merge cells
  const mergeCells = (start: string, end: string) => {
    if (!activeTemplate) return

    const startCoords = getCellCoords(start)
    const endCoords = getCellCoords(end)

    // Ensure start is top-left and end is bottom-right
    const startRow = Math.min(startCoords.row, endCoords.row)
    const startCol = Math.min(startCoords.col, endCoords.col)
    const endRow = Math.max(startCoords.row, endCoords.row)
    const endCol = Math.max(startCoords.col, endCoords.col)

    // Check if any of the cells are already part of a merged cell
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellId = getCellId(col, row)
        if (isCellMerged(cellId) && !isMergeOrigin(cellId)) {
          toast({
            title: "Cannot merge cells",
            description: "Some cells are already part of a merged cell.",
            variant: "destructive",
          })
          return
        }
      }
    }

    // Create the merged cell
    const mergedCell: MergedCell = {
      startRow,
      startCol,
      endRow,
      endCol,
    }

    // Add to history
    addToHistory({
      type: "merge",
      data: {
        mergedCell,
      },
    })

    // Add the merged cell to the template
    setActiveTemplate({
      ...activeTemplate,
      mergedCells: [...activeTemplate.mergedCells, mergedCell],
      lastModified: Date.now(),
    })

    toast({
      title: "Cells merged",
      description: `Cells from ${start} to ${end} have been merged.`,
    })
  }

  // Unmerge cells
  const unmergeCells = (cellId: string) => {
    if (!activeTemplate) return

    const { row, col } = getCellCoords(cellId)

    // Find the merged cell that contains this cell
    const mergedCellIndex = activeTemplate.mergedCells.findIndex(
      (mc) => row >= mc.startRow && row <= mc.endRow && col >= mc.startCol && col <= mc.endCol,
    )

    if (mergedCellIndex === -1) return

    // Store the merged cell for undo
    const mergedCell = activeTemplate.mergedCells[mergedCellIndex]

    // Add to history
    addToHistory({
      type: "unmerge",
      data: {
        mergedCell,
      },
    })

    // Remove the merged cell
    const newMergedCells = [...activeTemplate.mergedCells]
    newMergedCells.splice(mergedCellIndex, 1)

    setActiveTemplate({
      ...activeTemplate,
      mergedCells: newMergedCells,
      lastModified: Date.now(),
    })

    toast({
      title: "Cells unmerged",
      description: "The selected cells have been unmerged.",
    })
  }

  // Move cell content
  const moveCellContent = (source: string, target: string) => {
    if (!activeTemplate) return

    const sourceValue = getCellValue(source)
    const targetValue = getCellValue(target)

    // Add to history
    addToHistory({
      type: "move",
      data: {
        source,
        target,
        sourceValue,
        targetValue,
      },
    })

    // Update the target cell with the source cell's value
    setActiveTemplate({
      ...activeTemplate,
      cells: {
        ...activeTemplate.cells,
        [target]: sourceValue,
        [source]: { value: "" },
      },
      lastModified: Date.now(),
    })

    toast({
      title: "Cell moved",
      description: `Content moved from ${source} to ${target}.`,
    })
  }

  // Copy cell content
  const copyCellContent = () => {
    if (!selectedCell || !activeTemplate) return

    const selectedCellValue = getCellValue(selectedCell)

    setClipboard({
      cells: { [selectedCell]: selectedCellValue },
      startCell: selectedCell,
    })

    toast({
      title: "Cell copied",
      description: `Content from ${selectedCell} copied to clipboard.`,
    })
  }

  // Paste cell content
  const pasteCellContent = () => {
    if (!selectedCell || !clipboard || !activeTemplate) return

    const { cells: clipboardCells, startCell } = clipboard
    const startCoords = getCellCoords(startCell)
    const targetCoords = getCellCoords(selectedCell)

    // Calculate the offset
    const rowOffset = targetCoords.row - startCoords.row
    const colOffset = targetCoords.col - startCoords.col

    // Store old cells for undo
    const oldCells = { ...activeTemplate.cells }

    // Create new cells with the offset
    const newCells: Record<string, CellValue> = {}

    Object.entries(clipboardCells).forEach(([cellId, value]) => {
      const { row, col } = getCellCoords(cellId)
      const newRow = row + rowOffset
      const newCol = col + colOffset

      // Skip if out of bounds
      if (newRow < 0 || newRow >= activeTemplate.rowCount || newCol < 0 || newCol >= activeTemplate.colCount) {
        return
      }

      const newCellId = getCellId(newCol, newRow)
      newCells[newCellId] = { ...value }
    })

    // Add to history
    addToHistory({
      type: "cell_update",
      data: {
        oldCells,
        newCells,
      },
    })

    // Update the template
    setActiveTemplate({
      ...activeTemplate,
      cells: {
        ...activeTemplate.cells,
        ...newCells,
      },
      lastModified: Date.now(),
    })

    toast({
      title: "Content pasted",
      description: "Clipboard content has been pasted.",
    })
  }

  const memoizedCopyCellContent = useCallback(copyCellContent, [selectedCell, activeTemplate])
  const memoizedPasteCellContent = useCallback(pasteCellContent, [selectedCell, clipboard, activeTemplate])

  // Apply cell styling (background color, text color, borders)
  const applyCellStyling = (property: keyof CellValue, value: any) => {
    if (!selectedCell || !activeTemplate) return

    updateCellValue(selectedCell, {
      [property]: value,
    })
  }

  // Export template to Excel
  const exportToExcel = () => {
    if (!activeTemplate) return

    // Create a worksheet
    const ws = XLSX.utils.aoa_to_sheet([])

    // Add cells to the worksheet
    Object.entries(activeTemplate.cells).forEach(([cellId, cellValue]) => {
      if (cellValue.value) {
        const { row, col } = getCellCoords(cellId)
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col })

        // Create the cell
        if (!ws[cellRef]) {
          ws[cellRef] = { v: cellValue.value }
        }

        // Apply formatting
        if (
          cellValue.bold ||
          cellValue.italic ||
          cellValue.underline ||
          cellValue.align ||
          cellValue.backgroundColor ||
          cellValue.textColor
        ) {
          if (!ws[cellRef].s) ws[cellRef].s = {}

          // Font styling
          if (cellValue.bold || cellValue.italic || cellValue.underline) {
            ws[cellRef].s.font = {
              ...(ws[cellRef].s.font || {}),
              bold: cellValue.bold,
              italic: cellValue.italic,
              underline: cellValue.underline,
            }
          }

          // Alignment
          if (cellValue.align) {
            ws[cellRef].s.alignment = { horizontal: cellValue.align }
          }

          // Colors
          if (cellValue.backgroundColor) {
            ws[cellRef].s.fill = {
              fgColor: { rgb: cellValue.backgroundColor.replace("#", "") },
            }
          }

          if (cellValue.textColor) {
            if (!ws[cellRef].s.font) ws[cellRef].s.font = {}
            ws[cellRef].s.font.color = { rgb: cellValue.textColor.replace("#", "") }
          }

          // Borders
          if (cellValue.borderTop || cellValue.borderRight || cellValue.borderBottom || cellValue.borderLeft) {
            ws[cellRef].s.border = {
              top: cellValue.borderTop ? { style: "thin" } : undefined,
              right: cellValue.borderRight ? { style: "thin" } : undefined,
              bottom: cellValue.borderBottom ? { style: "thin" } : undefined,
              left: cellValue.borderLeft ? { style: "thin" } : undefined,
            }
          }
        }
      }
    })

    // Apply merged cells
    if (activeTemplate.mergedCells.length > 0) {
      ws["!merges"] = activeTemplate.mergedCells.map((mc) => ({
        s: { r: mc.startRow, c: mc.startCol },
        e: { r: mc.endRow, c: mc.endCol },
      }))
    }

    // Create a workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, activeTemplate.name)

    // Generate Excel file
    XLSX.writeFile(wb, `${activeTemplate.name}.xlsx`)

    toast({
      title: "Template exported",
      description: `Template "${activeTemplate.name}" has been exported as an Excel file.`,
    })
  }

  // Calculate paper dimensions based on size and orientation
  const getPaperDimensions = () => {
    if (!activeTemplate) return { width: 0, height: 0 }

    const { width, height } = PAPER_SIZES[activeTemplate.paperSize]

    return activeTemplate.orientation === "portrait" ? { width, height } : { width: height, height: width }
  }

  // Calculate the scale factor for the editor
  const getScaleFactor = () => {
    if (!activeTemplate) return 1

    const { width } = getPaperDimensions()
    // Base scale factor on the zoom level
    return (activeTemplate.zoom / 100) * Math.min(1, 800 / width)
  }

  // Check if a cell is selected or part of the current selection
  const isCellSelected = (cellId: string) => {
    if (selectedCell === cellId) return true

    if (isMergingCells && selectionStart && selectionEnd) {
      const startCoords = getCellCoords(selectionStart)
      const endCoords = getCellCoords(selectionEnd)
      const cellCoords = getCellCoords(cellId)

      const startRow = Math.min(startCoords.row, endCoords.row)
      const startCol = Math.min(startCoords.col, endCoords.col)
      const endRow = Math.max(startCoords.row, endCoords.row)
      const endCol = Math.max(startCoords.col, endCoords.col)

      return (
        cellCoords.row >= startRow && cellCoords.row <= endRow && cellCoords.col >= startCol && cellCoords.col <= endCol
      )
    }

    return false
  }

  // Get cell style based on its properties
  const getCellStyle = (cellId: string) => {
    const cellValue = getCellValue(cellId)
    const style: React.CSSProperties = {}

    if (cellValue.backgroundColor) {
      style.backgroundColor = cellValue.backgroundColor
    }

    if (cellValue.textColor) {
      style.color = cellValue.textColor
    }

    if (cellValue.borderTop) {
      style.borderTop = "1px solid #000"
    }

    if (cellValue.borderRight) {
      style.borderRight = "1px solid #000"
    }

    if (cellValue.borderBottom) {
      style.borderBottom = "1px solid #000"
    }

    if (cellValue.borderLeft) {
      style.borderLeft = "1px solid #000"
    }

    return style
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if we're editing a cell
      if (document.activeElement?.tagName === "INPUT") return

      // Ctrl+Z for undo
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault()
        undo()
      }

      // Ctrl+Y for redo
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault()
        redo()
      }

      // Ctrl+S for save
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault()
        saveTemplate()
      }

      // Ctrl+C for copy
      if (e.ctrlKey && e.key === "c" && selectedCell) {
        e.preventDefault()
        copyCellContent()
      }

      // Ctrl+V for paste
      if (e.ctrlKey && e.key === "v" && selectedCell) {
        e.preventDefault()
        pasteCellContent()
      }

      // Arrow keys for navigation
      if (selectedCell && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()

        const { row, col } = getCellCoords(selectedCell)
        let newRow = row
        let newCol = col

        switch (e.key) {
          case "ArrowUp":
            newRow = Math.max(0, row - 1)
            break
          case "ArrowDown":
            newRow = Math.min(activeTemplate?.rowCount || 0 - 1, row + 1)
            break
          case "ArrowLeft":
            newCol = Math.max(0, col - 1)
            break
          case "ArrowRight":
            newCol = Math.min(activeTemplate?.colCount || 0 - 1, col + 1)
            break
        }

        setSelectedCell(getCellId(newCol, newRow))
      }
    },
    [selectedCell, activeTemplate, memoizedCopyCellContent, memoizedPasteCellContent],
  )

  const memoizedUndo = useCallback(undo, [activeTemplate, historyIndex, history])
  const memoizedRedo = useCallback(redo, [activeTemplate, historyIndex, history])
  const memoizedSaveTemplate = useCallback(saveTemplate, [templates, activeTemplate, toast])

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [handleKeyDown])

  // Render the template editor
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template Editor</h1>
          <p className="text-muted-foreground">Create and edit templates for invoices, receipts, and more.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => saveTemplate()}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save template (Ctrl+S)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={createNewTemplate}>
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create new template</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={duplicateTemplate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate current template</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => xlsInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Import data from Excel file</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={exportToExcel}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export to Excel file</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setIsLogoDialogOpen(true)}>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Add Logo
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add company logo to template</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" onClick={deleteTemplate}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete current template</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <input type="file" ref={xlsInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
        </div>
      </div>

      {/* Toolbar */}
      {activeTemplate && (
        <Card className="p-2">
          <div className="flex flex-wrap items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex < 0}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="h-6 w-px bg-border mx-1" />

            {selectedCell && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateCellValue(selectedCell, { bold: !getCellValue(selectedCell).bold })}
                        className={getCellValue(selectedCell).bold ? "bg-accent" : ""}
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bold</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateCellValue(selectedCell, { italic: !getCellValue(selectedCell).italic })}
                        className={getCellValue(selectedCell).italic ? "bg-accent" : ""}
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Italic</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateCellValue(selectedCell, { underline: !getCellValue(selectedCell).underline })
                        }
                        className={getCellValue(selectedCell).underline ? "bg-accent" : ""}
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Underline</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="h-6 w-px bg-border mx-1" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateCellValue(selectedCell, { align: "left" })}
                        className={getCellValue(selectedCell).align === "left" ? "bg-accent" : ""}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Align left</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateCellValue(selectedCell, { align: "center" })}
                        className={getCellValue(selectedCell).align === "center" ? "bg-accent" : ""}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Align center</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateCellValue(selectedCell, { align: "right" })}
                        className={getCellValue(selectedCell).align === "right" ? "bg-accent" : ""}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Align right</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="h-6 w-px bg-border mx-1" />

                <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Background Color</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 border rounded" style={{ backgroundColor: cellBackgroundColor }} />
                          <ColorInput
                            type="color"
                            value={cellBackgroundColor}
                            onChange={(e) => setCellBackgroundColor(e.target.value)}
                          />
                          <Button size="sm" onClick={() => applyCellStyling("backgroundColor", cellBackgroundColor)}>
                            Apply
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 border rounded" style={{ backgroundColor: cellTextColor }} />
                          <ColorInput
                            type="color"
                            value={cellTextColor}
                            onChange={(e) => setCellTextColor(e.target.value)}
                          />
                          <Button size="sm" onClick={() => applyCellStyling("textColor", cellTextColor)}>
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover open={showBorderControls} onOpenChange={setShowBorderControls}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Square className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-2">
                      <Label>Cell Borders</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyCellStyling("borderTop", !getCellValue(selectedCell).borderTop)}
                          className={getCellValue(selectedCell).borderTop ? "bg-accent" : ""}
                        >
                          Top Border
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyCellStyling("borderRight", !getCellValue(selectedCell).borderRight)}
                          className={getCellValue(selectedCell).borderRight ? "bg-accent" : ""}
                        >
                          Right Border
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyCellStyling("borderBottom", !getCellValue(selectedCell).borderBottom)}
                          className={getCellValue(selectedCell).borderBottom ? "bg-accent" : ""}
                        >
                          Bottom Border
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applyCellStyling("borderLeft", !getCellValue(selectedCell).borderLeft)}
                          className={getCellValue(selectedCell).borderLeft ? "bg-accent" : ""}
                        >
                          Left Border
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            applyCellStyling("borderTop", true)
                            applyCellStyling("borderRight", true)
                            applyCellStyling("borderBottom", true)
                            applyCellStyling("borderLeft", true)
                          }}
                          className="col-span-2"
                        >
                          All Borders
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            applyCellStyling("borderTop", false)
                            applyCellStyling("borderRight", false)
                            applyCellStyling("borderBottom", false)
                            applyCellStyling("borderLeft", false)
                          }}
                          className="col-span-2"
                        >
                          No Borders
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <div className="h-6 w-px bg-border mx-1" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMergingCells(true)}
                        disabled={isMergingCells}
                      >
                        <Merge className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Merge cells</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => selectedCell && isMergeOrigin(selectedCell) && unmergeCells(selectedCell)}
                        disabled={!selectedCell || !isMergeOrigin(selectedCell)}
                      >
                        <Split className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Unmerge cells</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="h-6 w-px bg-border mx-1" />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setIsDragging(true)} disabled={isDragging}>
                        <MoveHorizontal className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Move cell content</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={copyCellContent}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy (Ctrl+C)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={pasteCellContent} disabled={!clipboard}>
                        <Clipboard className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Paste (Ctrl+V)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {lastSaved ? `Last saved: ${formatDate(lastSaved.getTime())}` : "Not saved yet"}
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="auto-save" className="text-sm">
                  Auto-save
                </Label>
                <Switch id="auto-save" checked={isAutoSaveEnabled} onCheckedChange={setIsAutoSaveEnabled} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Template settings sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={activeTemplate.name}
                  onChange={(e) =>
                    setActiveTemplate({
                      ...activeTemplate,
                      name: e.target.value,
                      lastModified: Date.now(),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">Category</Label>
                <Select
                  value={activeTemplate.category}
                  onValueChange={(value) =>
                    setActiveTemplate({
                      ...activeTemplate,
                      category: value,
                      lastModified: Date.now(),
                    })
                  }
                >
                  <SelectTrigger id="template-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select
                  value={activeTemplate.type}
                  onValueChange={(value) =>
                    setActiveTemplate({
                      ...activeTemplate,
                      type: value,
                      lastModified: Date.now(),
                    })
                  }
                >
                  <SelectTrigger id="template-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paper-size">Paper Size</Label>
                <Select
                  value={activeTemplate.paperSize}
                  onValueChange={(value: keyof typeof PAPER_SIZES) =>
                    setActiveTemplate({
                      ...activeTemplate,
                      paperSize: value,
                      lastModified: Date.now(),
                    })
                  }
                >
                  <SelectTrigger id="paper-size">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="LETTER">Letter</SelectItem>
                    <SelectItem value="LEGAL">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={activeTemplate.orientation}
                  onValueChange={(value: "portrait" | "landscape") =>
                    setActiveTemplate({
                      ...activeTemplate,
                      orientation: value,
                      lastModified: Date.now(),
                    })
                  }
                >
                  <SelectTrigger id="orientation">
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zoom</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[activeTemplate.zoom]}
                    min={50}
                    max={200}
                    step={10}
                    onValueChange={(value) =>
                      setActiveTemplate({
                        ...activeTemplate,
                        zoom: value[0],
                        lastModified: Date.now(),
                      })
                    }
                  />
                  <span className="w-12 text-right">{activeTemplate.zoom}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Placeholders</Label>
                <Tabs defaultValue="company">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="company">Company</TabsTrigger>
                    <TabsTrigger value="customer">Customer</TabsTrigger>
                    <TabsTrigger value="invoice">Invoice</TabsTrigger>
                  </TabsList>
                  <TabsContent value="company" className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{company_name}}")}
                    >
                      Company Name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{company_address}}")}
                    >
                      Company Address
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{company_phone}}")}
                    >
                      Company Phone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{company_email}}")}
                    >
                      Company Email
                    </Button>
                  </TabsContent>
                  <TabsContent value="customer" className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{customer_name}}")}
                    >
                      Customer Name
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{customer_address}}")}
                    >
                      Customer Address
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{customer_phone}}")}
                    >
                      Customer Phone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{customer_email}}")}
                    >
                      Customer Email
                    </Button>
                  </TabsContent>
                  <TabsContent value="invoice" className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{invoice_number}}")}
                    >
                      Invoice Number
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{date}}")}
                    >
                      Date
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{due_date}}")}
                    >
                      Due Date
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{subtotal}}")}
                    >
                      Subtotal
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{tax}}")}
                    >
                      Tax
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addPlaceholder("{{total}}")}
                    >
                      Total
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => setShowGridLines(!showGridLines)}>
                    <Grid className="mr-2 h-4 w-4" />
                    {showGridLines ? "Hide Grid Lines" : "Show Grid Lines"}
                  </Button>
                  <Button variant="outline" onClick={addRow}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                  </Button>
                  <Button variant="outline" onClick={addColumn}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Column
                  </Button>
                  <Button variant="outline">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Preview
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm("Are you sure you want to reset all cell formatting?")) {
                        // Reset all cell formatting but keep values
                        const newCells: Record<string, CellValue> = {}
                        Object.entries(activeTemplate.cells).forEach(([cellId, cellValue]) => {
                          newCells[cellId] = { value: cellValue.value }
                        })

                        setActiveTemplate({
                          ...activeTemplate,
                          cells: newCells,
                          lastModified: Date.now(),
                        })

                        toast({
                          title: "Formatting reset",
                          description: "All cell formatting has been reset.",
                        })
                      }
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Formatting
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Template Info</Label>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Created:</span> {formatDate(activeTemplate.createdAt)}
                  </p>
                  <p>
                    <span className="font-medium">Modified:</span> {formatDate(activeTemplate.lastModified)}
                  </p>
                  <p>
                    <span className="font-medium">ID:</span> {activeTemplate.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template editor */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{activeTemplate.name}</CardTitle>
                <CardDescription>
                  {activeTemplate.paperSize}, {activeTemplate.orientation}
                  {isMergingCells && (
                    <Badge variant="outline" className="ml-2">
                      Merging Cells
                    </Badge>
                  )}
                  {isDragging && (
                    <Badge variant="outline" className="ml-2">
                      Moving Cells
                    </Badge>
                  )}
                </CardDescription>
              </div>
              {selectedCell && (
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">Cell: {selectedCell}</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div
                className="overflow-auto border rounded-md bg-white"
                style={{
                  width: "100%",
                  height: "600px",
                }}
              >
                <div
                  className="relative"
                  style={{
                    width: `${getPaperDimensions().width * getScaleFactor()}mm`,
                    height: `${getPaperDimensions().height * getScaleFactor()}mm`,
                    transform: `scale(${getScaleFactor()})`,
                    transformOrigin: "top left",
                    backgroundColor: "white",
                  }}
                  ref={gridRef}
                >
                  {/* Company Logo */}
                  {activeTemplate.companyLogo && (
                    <div className="absolute top-2 right-2 z-20">
                      <img
                        src={activeTemplate.companyLogo || "/placeholder.svg"}
                        alt="Company Logo"
                        className="max-w-[100px] max-h-[50px] object-contain"
                      />
                    </div>
                  )}

                  {/* Column headers */}
                  <div className="flex absolute top-0 left-0 z-10">
                    <div className="w-10 h-6 bg-gray-100 border-r border-b"></div>
                    {Array.from({ length: activeTemplate.colCount }).map((_, colIndex) => (
                      <div
                        key={colIndex}
                        className="w-24 h-6 bg-gray-100 border-r border-b flex items-center justify-center text-xs font-medium"
                      >
                        {getColumnHeader(colIndex)}
                      </div>
                    ))}
                  </div>

                  {/* Row headers */}
                  <div className="flex flex-col absolute top-6 left-0 z-10">
                    {Array.from({ length: activeTemplate.rowCount }).map((_, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="w-10 h-8 bg-gray-100 border-r border-b flex items-center justify-center text-xs font-medium"
                      >
                        {rowIndex + 1}
                      </div>
                    ))}
                  </div>

                  {/* Grid cells */}
                  <div className="absolute top-6 left-10" onMouseUp={handleCellMouseUp}>
                    {Array.from({ length: activeTemplate.rowCount }).map((_, rowIndex) => (
                      <div key={rowIndex} className="flex">
                        {Array.from({ length: activeTemplate.colCount }).map((_, colIndex) => {
                          const cellId = getCellId(colIndex, rowIndex)
                          const cellValue = getCellValue(cellId)

                          // Skip rendering cells that are part of a merged cell but not the origin
                          if (isCellMerged(cellId) && !isMergeOrigin(cellId)) {
                            return null
                          }

                          // Get merged cell dimensions
                          const { rowSpan, colSpan } = getMergedCellDimensions(cellId)

                          // Fix the cell dimensions to ensure proper sizing:
                          const cellWidth = 24
                          const cellHeight = 8

                          return (
                            <div
                              key={colIndex}
                              className={`
              ${showGridLines ? "border-r border-b" : ""}
              flex items-center px-1 cursor-pointer relative
              ${isCellSelected(cellId) ? "bg-blue-50 outline outline-2 outline-blue-500" : ""}
              ${isDragging && draggedCell === cellId ? "bg-yellow-100" : ""}
              ${isDragging && dragTarget === cellId ? "bg-green-100" : ""}
            `}
                              // Then update the cell style:
                              style={{
                                width: `${colSpan * cellWidth}px`,
                                height: `${rowSpan * cellHeight}px`,
                                ...getCellStyle(cellId),
                              }}
                              onClick={() => setSelectedCell(cellId)}
                              onMouseDown={(e) => handleCellMouseDown(cellId, e)}
                              onMouseEnter={() => handleCellMouseEnter(cellId)}
                            >
                              {selectedCell === cellId ? (
                                <Input
                                  value={cellValue.value}
                                  onChange={(e) => updateCellValue(cellId, { value: e.target.value })}
                                  className={`
                  h-7 p-1 border-none focus-visible:ring-0 w-full
                  ${cellValue.bold ? "font-bold" : ""}
                  ${cellValue.italic ? "italic" : ""}
                  ${cellValue.underline ? "underline" : ""}
                  ${cellValue.align === "center" ? "text-center" : ""}
                  ${cellValue.align === "right" ? "text-right" : ""}
                  ${cellValue.isPlaceholder ? "text-blue-600" : ""}
                `}
                                  style={{
                                    textAlign: cellValue.align || "left",
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className={`
                  w-full truncate
                  ${cellValue.bold ? "font-bold" : ""}
                  ${cellValue.italic ? "italic" : ""}
                  ${cellValue.underline ? "underline" : ""}
                  ${cellValue.align === "center" ? "text-center" : ""}
                  ${cellValue.align === "right" ? "text-right" : ""}
                  ${cellValue.isPlaceholder ? "text-blue-600" : ""}
                `}
                                >
                                  {cellValue.value}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {activeTemplate.rowCount} rows × {activeTemplate.colCount} columns
              </div>
              <div className="text-sm text-muted-foreground">
                {getPaperDimensions().width} × {getPaperDimensions().height} mm
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Template list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Available Templates</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer hover:bg-accent/50 ${activeTemplate?.id === template.id ? "border-primary" : ""}`}
                  onClick={() => setActiveTemplate(template)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    {template.type === "invoice" ? (
                      <FileText className="h-8 w-8 text-primary" />
                    ) : (
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{template.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {template.paperSize}, {template.orientation}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Modified: {new Date(template.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
                <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No templates found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || categoryFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first template to get started"}
                </p>
                {(searchQuery || categoryFilter !== "all") && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("")
                      setCategoryFilter("all")
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
            {isUploading && (
              <Card className="cursor-pointer hover:bg-accent/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div>
                    <h3 className="font-medium">Uploading...</h3>
                    <p className="text-sm text-muted-foreground">Please wait</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload Dialog */}
      <Dialog open={isLogoDialogOpen} onOpenChange={setIsLogoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Company Logo</DialogTitle>
            <DialogDescription>Upload a logo to display on your template.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              {logoUrl ? (
                <div className="border rounded-md p-2 bg-white">
                  <img
                    src={logoUrl || "/placeholder.svg"}
                    alt="Company Logo Preview"
                    className="max-w-full max-h-[200px] object-contain"
                  />
                </div>
              ) : (
                <div className="border rounded-md p-8 bg-muted flex flex-col items-center gap-2">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No logo selected</p>
                </div>
              )}
              <Button variant="outline" onClick={() => logoInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {logoUrl ? "Change Logo" : "Upload Logo"}
              </Button>
              <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveLogoToTemplate} disabled={!logoUrl}>
              Save Logo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* XLS Import Dialog */}
      <Dialog open={isXlsDialogOpen} onOpenChange={setIsXlsDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Excel Data</DialogTitle>
            <DialogDescription>Preview and import data from your Excel file.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4">
              <Label htmlFor="sheet-select">Sheet:</Label>
              <Select value={selectedSheet} onValueChange={changeXlsSheet}>
                <SelectTrigger id="sheet-select" className="w-[200px]">
                  <SelectValue placeholder="Select sheet" />
                </SelectTrigger>
                <SelectContent>
                  {xlsSheets.map((sheet) => (
                    <SelectItem key={sheet} value={sheet}>
                      {sheet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="h-[400px] border rounded-md">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="w-10 p-2 border text-left">#</th>
                    {Array.from({ length: Math.min(10, xlsData[0]?.length || 0) }).map((_, index) => (
                      <th key={index} className="p-2 border text-left">
                        {getColumnHeader(index)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {xlsData.slice(0, 20).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="p-2 border text-muted-foreground">{rowIndex + 1}</td>
                      {row.slice(0, 10).map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2 border">
                          {cell !== null && cell !== undefined ? String(cell) : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
            {xlsData.length > 20 && (
              <p className="text-sm text-muted-foreground mt-2">
                Showing first 20 rows of {xlsData.length} total rows.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsXlsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={importXlsData}>Import Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

