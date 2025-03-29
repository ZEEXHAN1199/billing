import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Customer } from "../types"
import { initialCustomers } from "../initial-data"

interface CustomerState {
  customers: Customer[]
  addCustomer: (customer: Omit<Customer, "id" | "totalSpent" | "lastPurchase">) => void
  updateCustomer: (id: string, customer: Partial<Customer>) => void
  deleteCustomer: (id: string) => void
  updateCustomerSpending: (id: string, amount: number) => void
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      customers: initialCustomers,
      addCustomer: (customer) =>
        set((state) => ({
          customers: [
            ...state.customers,
            {
              ...customer,
              id: crypto.randomUUID(),
              totalSpent: 0,
              lastPurchase: "Never",
            },
          ],
        })),
      updateCustomer: (id, customer) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...customer } : c)),
        })),
      deleteCustomer: (id) =>
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        })),
      updateCustomerSpending: (id, amount) =>
        set((state) => ({
          customers: state.customers.map((c) => {
            if (c.id === id) {
              return {
                ...c,
                totalSpent: c.totalSpent + amount,
                lastPurchase: new Date().toISOString().split("T")[0],
              }
            }
            return c
          }),
        })),
    }),
    {
      name: "customer-storage",
    },
  ),
)

