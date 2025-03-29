import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Payment, PaymentDirection, PaymentSummary } from "../payment-types"

interface PaymentState {
  payments: Payment[]
  addPayment: (payment: Omit<Payment, "id">) => string
  updatePayment: (id: string, payment: Partial<Payment>) => void
  deletePayment: (id: string) => void
  getPaymentsByRelated: (relatedId: string, relatedType: string) => Payment[]
  getPaymentsByDirection: (direction: PaymentDirection) => Payment[]
  getPaymentSummary: (relatedId?: string, relatedType?: string) => PaymentSummary
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      payments: [],

      addPayment: (payment) => {
        const id = crypto.randomUUID()
        set((state) => ({
          payments: [{ ...payment, id }, ...state.payments],
        }))
        return id
      },

      updatePayment: (id, payment) => {
        set((state) => ({
          payments: state.payments.map((p) => (p.id === id ? { ...p, ...payment } : p)),
        }))
      },

      deletePayment: (id) => {
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
        }))
      },

      getPaymentsByRelated: (relatedId, relatedType) => {
        return get().payments.filter((p) => p.relatedId === relatedId && p.relatedType === relatedType)
      },

      getPaymentsByDirection: (direction) => {
        return get().payments.filter((p) => p.direction === direction)
      },

      getPaymentSummary: (relatedId, relatedType) => {
        const payments = relatedId && relatedType ? get().getPaymentsByRelated(relatedId, relatedType) : get().payments

        const summary: PaymentSummary = {
          totalIncoming: 0,
          totalOutgoing: 0,
          balance: 0,
          pendingIncoming: 0,
          pendingOutgoing: 0,
        }

        payments.forEach((payment) => {
          if (payment.direction === "incoming") {
            summary.totalIncoming += payment.amount
          } else {
            summary.totalOutgoing += payment.amount
          }
        })

        summary.balance = summary.totalIncoming - summary.totalOutgoing

        return summary
      },
    }),
    {
      name: "payment-storage",
    },
  ),
)

