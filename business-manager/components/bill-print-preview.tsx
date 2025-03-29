"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PrinterIcon } from "lucide-react"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import { useCompanyInfoStore } from "@/lib/stores/company-info-store"
import type { Bill, BillItem } from "@/lib/types"
import Image from "next/image"

interface BillPrintPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  customerName: string
  items: BillItem[]
  total: number
  existingBill?: Bill
  transactionType?: string
  status?: string
  date?: string
}

export function BillPrintPreview({
  open,
  onOpenChange,
  invoiceId,
  customerName,
  items,
  total,
  existingBill,
  transactionType = "bill",
  status = "pending",
  date,
}: BillPrintPreviewProps) {
  const { currencySymbol } = useCurrencyStore()
  const { companyInfo } = useCompanyInfoStore()
  const printContainerRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printWindow = window.open("", "", "height=800,width=800")
    if (!printWindow) return

    const printContent = printContainerRef.current?.innerHTML || ""

    const printHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} - ${companyInfo.name}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0;
            padding: 0;
            background-color: white;
            color: black;
          }
          .print-bill-container {
            width: 100%;
            max-width: 800px;
            background: #fff;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
          }
          .print-bill-header {
            display: flex;
            align-items: center;
            background: #eaeaea;
            padding: 15px;
            border-bottom: 2px solid #333;
            margin-bottom: 20px;
          }
          .print-bill-monogram-box {
            width: 60px;
            height: 60px;
            border: 1px solid #333;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            flex-shrink: 0;
          }
          .print-bill-monogram-box img {
            max-width: 100%;
            max-height: 100%;
          }
          .print-bill-title-content {
            flex-grow: 1;
            margin-left: 15px;
            padding-left: 10px;
            border-left: 2px solid #333;
          }
          .print-bill-title-content h1 {
            margin: 0;
            font-size: 18px;
            color: #333;
          }
          .print-bill-title-content p {
            margin: 2px 0;
            font-size: 12px;
            color: #555;
          }
          .print-bill-prop-info {
            margin-top: 4px;
            font-style: italic;
            font-size: 12px;
            color: #444;
          }
          .print-bill-body-content {
            padding: 15px;
            border-top: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            margin-top: 10px;
            margin-bottom: 20px;
          }
          .print-bill-info {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            margin-bottom: 20px;
            gap: 10px;
          }
          .print-bill-info div {
            flex: 1;
            min-width: 120px;
          }
          .print-bill-table-container {
            margin-bottom: 20px;
            overflow-x: auto;
          }
          .print-bill-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          .print-bill-table th, 
          .print-bill-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
          }
          .print-bill-table th {
            background: #eee;
          }
          .print-bill-description {
            font-size: 10px;
            font-style: italic;
            color: #555;
            text-align: left;
          }
          .print-bill-grand-total {
            text-align: right;
            font-weight: bold;
            font-size: 14px;
            padding: 8px 0;
            border-top: 2px solid #333;
            margin-bottom: 20px;
          }
          .print-bill-footer {
            text-align: center;
            font-size: 12px;
            padding: 15px 0;
            border-top: 2px solid #333;
            background: #fff;
            margin-top: 30px;
          }
          .print-bill-footer p {
            margin: 2px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 12px;
            background-color: #ccc;
          }
          .status-paid {
            background-color: #4caf50;
            color: white;
          }
          .status-partial {
            background-color: #ff9800;
            color: black;
          }
          .status-unpaid {
            background-color: #f44336;
            color: white;
          }
          .payment-summary {
            margin-top: 15px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .payment-label {
            font-weight: bold;
          }
          @media print {
            body {
              width: 100% !important;
              transform: none !important;
              background: white !important;
              color: black !important;
            }
            .print-bill-header, 
            .print-bill-footer {
              position: static;
              width: 100%;
              background: #eaeaea;
            }
            .print-bill-body-content {
              margin-top: 10px;
              margin-bottom: 10px;
            }
            .print-bill-container {
              box-shadow: none;
              border: none;
              width: auto;
              margin: 0;
              padding: 20px;
            }
            .print-bill-table th, 
            .print-bill-table td {
              border: 1px solid #333 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-bill-container">
          ${printContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(printHTML)
    printWindow.document.close()
    printWindow.focus()
  }

  const getTitle = () => {
    switch (transactionType) {
      case "bill":
        return "Invoice"
      case "purchase":
        return "Purchase Order"
      case "order":
        return "Manufacturing Order"
      default:
        return "Invoice"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString()
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (e) {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader className="no-print">
          <DialogTitle>{getTitle()} Preview</DialogTitle>
        </DialogHeader>

        <div ref={printContainerRef} className="print-bill-container">
          {/* HEADER - Fixed at top */}
          <div className="print-bill-header">
            <div className="print-bill-monogram-box">
              {companyInfo.logo && (
                <Image
                  src={companyInfo.logo || "/placeholder.svg"}
                  alt="Company logo"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              )}
            </div>
            <div className="print-bill-title-content">
              <h1>{companyInfo.name.toUpperCase()}</h1>
              <p>{companyInfo.quote}</p>
              <div className="print-bill-prop-info">
                Ph# {companyInfo.phone1}
                {companyInfo.phone2 ? `, ${companyInfo.phone2}` : ""}
              </div>
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div className="print-bill-body-content">
            <div className="print-bill-info">
              <div>
                <strong>{transactionType === "purchase" ? "Vendor:" : "Name:"}</strong> {customerName}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {date ? formatDate(date) : existingBill ? formatDate(existingBill.date) : formatDate()}
              </div>
              <div>
                <strong>{getTitle()} #:</strong> {invoiceId}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span className={`status-badge status-${status}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </div>

            {/* BILL CONTENT - Expandable */}
            <div className="print-bill-table-container">
              <table className="print-bill-table">
                <thead>
                  <tr>
                    <th>Item#</th>
                    <th>Description</th>
                    <th>QTY</th>
                    <th>Price ({currencySymbol})</th>
                    <th>Total ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody>
                  {items && items.length > 0 ? (
                    items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          {item.name}
                          {item.description && <div className="print-bill-description">({item.description})</div>}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{item.price?.toFixed(2) || "0.00"}</td>
                        <td>{(item.total || item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>
                        No items
                      </td>
                    </tr>
                  )}
                  {/* Add empty rows to fill space if needed */}
                  {items &&
                    items.length < 5 &&
                    Array.from({ length: 5 - items.length }).map((_, i) => (
                      <tr key={`empty-${i}`}>
                        <td>{items.length + i + 1}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Payment Summary */}
            {existingBill && (
              <div className="payment-summary">
                <div className="payment-row">
                  <span className="payment-label">Subtotal:</span>
                  <span>
                    {currencySymbol} {existingBill.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="payment-row">
                  <span className="payment-label">Discount:</span>
                  <span>
                    {currencySymbol} {existingBill.discount.toFixed(2)}
                  </span>
                </div>
                <div className="payment-row">
                  <span className="payment-label">Amount Paid:</span>
                  <span>
                    {currencySymbol} {existingBill.amountPaid.toFixed(2)}
                  </span>
                </div>
                <div className="payment-row">
                  <span className="payment-label">Balance:</span>
                  <span>
                    {currencySymbol} {existingBill.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div className="print-bill-grand-total">
              GRAND TOTAL: {currencySymbol} {total.toFixed(2)}
            </div>
          </div>

          {/* FOOTER - Fixed at bottom */}
          <div className="print-bill-footer">
            <p>{companyInfo.site && <>Website: {companyInfo.site}</>}</p>
            <p>
              Email: <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a>
            </p>
            <p>{companyInfo.address}</p>
          </div>
        </div>

        <DialogFooter className="no-print">
          <Button onClick={handlePrint}>
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

