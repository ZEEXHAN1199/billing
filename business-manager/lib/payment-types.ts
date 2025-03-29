export type PaymentDirection = "incoming" | "outgoing"
export type PaymentMethod = "cash" | "bank" | "check" | "online" | "credit" | "other"

export type Payment = {
  id: string
  date: string
  amount: number
  direction: PaymentDirection
  method: PaymentMethod
  reference: string // Reference number, check number, etc.
  notes: string
  relatedId: string // ID of related bill, order, purchase, etc.
  relatedType: "customer" | "supplier" | "manufacturing"
  discount?: number
  tax?: number
}

export type PaymentSummary = {
  totalIncoming: number
  totalOutgoing: number
  balance: number
  pendingIncoming: number
  pendingOutgoing: number
}

