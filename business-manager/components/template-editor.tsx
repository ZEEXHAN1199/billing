"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
  Calendar,
  Hash,
  Plus,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TemplateEditorProps {
  data: any[][]
  onChange?: (data: any[][]) => void
  readOnly?: boolean
  showGridLines?: boolean
  paperSize?: "A4" | "A5" | "Letter"
  orientation?: "portrait" | "landscape"
}

export function TemplateEditor({
  data = [],
  onChange,
  readOnly = false,
  showGridLines = true,
  paperSize = "A4",
  orientation = "portrait",
}: TemplateEditorProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null)
  const [cellStyles, setCellStyles] = useState<Record<string, any>>({})
  const [isFormatting, setIsFormatting] = useState(false)
  const [isInsertingPlaceholder, setIsInsertingPlaceholder] = useState(false)
  const tableRef = useRef<HTMLTableElement>(null)

  // Ensure we have at least a minimum grid size
  useEffect(() => {
    if (!data || data.length === 0) {
      const initialData = Array(20)
        .fill(0)
        .map(() => Array(10).fill(""))
      if (onChange) onChange(initialData)
    }
  }, [data, onChange])

  // Calculate dimensions based on paper size
  const getPaperDimensions = () => {
    // Standard paper sizes in mm
    const sizes = {
      A4: { width: 210, height: 297 },
      A5: { width: 148, height: 210 },
      Letter: { width: 216, height: 279 },
    }

    const size = sizes[paperSize]
    return orientation === "portrait"
      ? { width: size.width, height: size.height }
      : { width: size.height, height: size.width }
  }

  const dimensions = getPaperDimensions()

  const handleCellClick = (row: number, col: number) => {
    if (readOnly) return
    setSelectedCell({ row, col })
  }

  const handleCellChange = (row: number, col: number, value: string) => {
    if (readOnly || !onChange) return

    const newData = [...data]
    // Ensure the row exists
    if (!newData[row]) {
      newData[row] = []
    }
    newData[row][col] = value
    onChange(newData)
  }

  const getCellKey = (row: number, col: number) => `${row}-${col}`

  const getCellStyle = (row: number, col: number) => {
    const key = getCellKey(row, col)
    return cellStyles[key] || {}
  }

  const updateCellStyle = (style: Record<string, any>) => {
    if (!selectedCell || readOnly) return

    const key = getCellKey(selectedCell.row, selectedCell.col)
    setCellStyles({
      ...cellStyles,
      [key]: {
        ...cellStyles[key],
        ...style,
      },
    })
  }

  const applyTextFormat = (format: string) => {
    if (!selectedCell) return

    const currentStyle = getCellStyle(selectedCell.row, selectedCell.col)

    switch (format) {
      case "bold":
        updateCellStyle({ fontWeight: currentStyle.fontWeight === "bold" ? "normal" : "bold" })
        break
      case "italic":
        updateCellStyle({ fontStyle: currentStyle.fontStyle === "italic" ? "normal" : "italic" })
        break
      case "underline":
        updateCellStyle({ textDecoration: currentStyle.textDecoration === "underline" ? "none" : "underline" })
        break
      case "alignLeft":
        updateCellStyle({ textAlign: "left" })
        break
      case "alignCenter":
        updateCellStyle({ textAlign: "center" })
        break
      case "alignRight":
        updateCellStyle({ textAlign: "right" })
        break
      case "alignJustify":
        updateCellStyle({ textAlign: "justify" })
        break
    }
  }

  const insertPlaceholder = (placeholder: string) => {
    if (!selectedCell || readOnly || !onChange) return

    const { row, col } = selectedCell
    const currentValue = data[row]?.[col] || ""
    handleCellChange(row, col, `${currentValue}{${placeholder}}`)
    setIsInsertingPlaceholder(false)
  }

  const addRow = () => {
    if (readOnly || !onChange || !data.length) return

    const newRow = Array(data[0].length).fill("")
    const newData = [...data, newRow]
    onChange(newData)
  }

  const addColumn = () => {
    if (readOnly || !onChange) return

    const newData = data.map((row) => [...row, ""])
    onChange(newData)
  }

  const deleteRow = (rowIndex: number) => {
    if (readOnly || !onChange || data.length <= 1) return

    const newData = data.filter((_, index) => index !== rowIndex)
    onChange(newData)

    if (selectedCell?.row === rowIndex) {
      setSelectedCell(null)
    }
  }

  const deleteColumn = (colIndex: number) => {
    if (readOnly || !onChange || !data[0] || data[0].length <= 1) return

    const newData = data.map((row) => row.filter((_, index) => index !== colIndex))
    onChange(newData)

    if (selectedCell?.col === colIndex) {
      setSelectedCell(null)
    }
  }

  return (
    <div className="template-editor">
      {!readOnly && (
        <div className="flex items-center gap-2 p-2 border-b">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => applyTextFormat("bold")}
              className={cn(
                selectedCell && getCellStyle(selectedCell.row, selectedCell.col).fontWeight === "bold"
                  ? "bg-accent"
                  : "",
              )}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => applyTextFormat("italic")}
              className={cn(
                selectedCell && getCellStyle(selectedCell.row, selectedCell.col).fontStyle === "italic"
                  ? "bg-accent"
                  : "",
              )}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => applyTextFormat("underline")}
              className={cn(
                selectedCell && getCellStyle(selectedCell.row, selectedCell.col).textDecoration === "underline"
                  ? "bg-accent"
                  : "",
              )}
            >
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 border-l mx-1"></div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => applyTextFormat("alignLeft")}
              className={cn(
                selectedCell && getCellStyle(selectedCell.row, selectedCell.col).textAlign === "left"
                  ? "bg-accent"
                  : "",
              )}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => applyTextFormat("alignCenter")}
              className={cn(
                selectedCell && getCellStyle(selectedCell.row, selectedCell.col).textAlign === "center"
                  ? "bg-accent"
                  : "",
              )}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => applyTextFormat("alignRight")}
              className={cn(
                selectedCell && getCellStyle(selectedCell.row, selectedCell.col).textAlign === "right"
                  ? "bg-accent"
                  : "",
              )}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 border-l mx-1"></div>

          <Popover open={isInsertingPlaceholder} onOpenChange={setIsInsertingPlaceholder}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Hash className="h-4 w-4" />
                Insert Placeholder
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <Tabs defaultValue="common">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="common">Common</TabsTrigger>
                  <TabsTrigger value="customer">Customer</TabsTrigger>
                  <TabsTrigger value="items">Items</TabsTrigger>
                </TabsList>
                <TabsContent value="common" className="space-y-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("date")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Date
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("invoice_id")}
                  >
                    <Hash className="h-4 w-4 mr-2" />
                    Invoice ID
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("total")}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Total Amount
                  </Button>
                </TabsContent>
                <TabsContent value="customer" className="space-y-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("customer_name")}
                  >
                    Customer Name
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("customer_address")}
                  >
                    Customer Address
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("customer_phone")}
                  >
                    Customer Phone
                  </Button>
                </TabsContent>
                <TabsContent value="items" className="space-y-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("items_count")}
                  >
                    Items Count
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("subtotal")}
                  >
                    Subtotal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPlaceholder("discount")}
                  >
                    Discount
                  </Button>
                </TabsContent>
              </Tabs>
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={addRow} className="gap-1">
              <Plus className="h-4 w-4" />
              Row
            </Button>
            <Button variant="outline" size="sm" onClick={addColumn} className="gap-1">
              <Plus className="h-4 w-4" />
              Column
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn("overflow-auto p-4", orientation === "portrait" ? "portrait" : "landscape")}
        style={{
          width: `${dimensions.width}mm`,
          minHeight: `${dimensions.height}mm`,
          maxWidth: "100%",
          margin: "0 auto",
          background: "white",
          boxShadow: !readOnly ? "0 0 10px rgba(0, 0, 0, 0.1)" : "none",
        }}
      >
        <table
          ref={tableRef}
          className={cn("w-full border-collapse", showGridLines ? "table-bordered" : "table-borderless")}
        >
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "relative p-1 min-w-[40px] h-8",
                      showGridLines ? "border border-gray-200" : "",
                      selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? "bg-blue-100" : "",
                      hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex && !readOnly ? "bg-gray-50" : "",
                    )}
                    style={getCellStyle(rowIndex, colIndex)}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {readOnly ? (
                      <div>{cell}</div>
                    ) : (
                      <Input
                        value={cell || ""}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="w-full h-full p-0 border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        style={getCellStyle(rowIndex, colIndex)}
                      />
                    )}

                    {!readOnly && hoveredCell?.row === rowIndex && colIndex === row.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-6 top-1/2 transform -translate-y-1/2 h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteRow(rowIndex)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}

                    {!readOnly && hoveredCell?.col === colIndex && rowIndex === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-1/2 -top-6 transform -translate-x-1/2 h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteColumn(colIndex)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx global>{`
        .template-editor .table-bordered td {
          border: 1px solid #e2e8f0;
        }
        
        .template-editor .table-borderless td {
          border: none;
        }
        
        .template-editor .portrait {
          width: ${dimensions.width}mm;
          min-height: ${dimensions.height}mm;
        }
        
        .template-editor .landscape {
          width: ${dimensions.width}mm;
          min-height: ${dimensions.height}mm;
        }
      `}</style>
    </div>
  )
}

