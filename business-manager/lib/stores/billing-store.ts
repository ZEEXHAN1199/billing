import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Bill, BillItem } from "@/lib/types"

interface BillingState {
  cart: BillItem[]
  bills: Bill[]
  invoiceCounter: number
  editingBillId: string | null
  addToCart: (item: Omit<BillItem, "id" | "total">) => void
  updateCartItem: (id: string, item: Partial<BillItem>) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  getCartTotal: () => number
  generateBill: (
    customerId: string,
    customerName: string,
    status: "paid" | "partial" | "unpaid",
    amountPaid: number,
    discount: number,
  ) => void
  updateBill: (id: string, bill: Partial<Bill>) => void
  deleteBill: (id: string) => void
  setEditingBill: (id: string | null) => void
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      cart: [],
      bills: [],
      invoiceCounter: 1001,
      editingBillId: null,

      addToCart: (item) => {
        set((state) => ({
          cart: [
            ...state.cart,
            {
              ...item,
              id: crypto.randomUUID(),
              total: item.price * item.quantity,
            },
          ],
        }))
      },

      updateCartItem: (id, item) => {
        set((state) => ({
          cart: state.cart.map((cartItem) => {
            if (cartItem.id === id) {
              const updatedItem = { ...cartItem, ...item }
              // Recalculate total if price or quantity changed
              if (item.price !== undefined || item.quantity !== undefined) {
                updatedItem.total = updatedItem.price * updatedItem.quantity
              }
              return updatedItem
            }
            return cartItem
          }),
        }))
      },

      removeFromCart: (id) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        }))
      },

      clearCart: () => {
        set({ cart: [] })
      },

      getCartTotal: () => {
        return get().cart.reduce((sum, item) => sum + item.total, 0)
      },

      generateBill: (customerId, customerName, status, amountPaid, discount) => {
        const { cart, invoiceCounter, editingBillId } = get()
        const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
        const total = subtotal - discount
        const balance = total - amountPaid

        if (editingBillId) {
          // Update existing bill
          set((state) => ({
            bills: state.bills.map((bill) =>
              bill.id === editingBillId
                ? {
                    ...bill,
                    customerId,
                    customerName,
                    items: [...cart],
                    subtotal,
                    discount,
                    total,
                    amountPaid,
                    balance,
                    status,
                  }
                : bill,
            ),
            cart: [],
            editingBillId: null,
          }))
        } else {
          // Create new bill
          const newBill: Bill = {
            id: `INV-${invoiceCounter}`,
            customerId,
            customerName,
            date: new Date().toISOString(),
            items: [...cart],
            subtotal,
            discount,
            total,
            amountPaid,
            balance,
            status,
          }

          set((state) => ({
            bills: [...state.bills, newBill],
            cart: [],
            invoiceCounter: state.invoiceCounter + 1,
          }))
        }
      },

      updateBill: (id, bill) => {
        set((state) => ({
          bills: state.bills.map((b) => (b.id === id ? { ...b, ...bill } : b)),
        }))
      },

      deleteBill: (id) => {
        set((state) => ({
          bills: state.bills.filter((b) => b.id !== id),
        }))
      },

      setEditingBill: (id) => {
        const { bills } = get()

        if (id) {
          const billToEdit = bills.find((b) => b.id === id)
          if (billToEdit) {
            set({
              cart: [...billToEdit.items],
              editingBillId: id,
            })
          }
        } else {
          set({
            editingBillId: null,
          })
        }
      },
    }),
    {
      name: "billing-storage",
    },
  ),
)

