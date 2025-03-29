import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "@/lib/types"

interface InventoryState {
  products: Product[]
  addProduct: (product: Omit<Product, "id">) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  updateStock: (id: string, quantity: number) => void
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      products: [
        {
          id: "prod-1",
          name: "Product 1",
          description: "High-quality product with premium features",
          price: 100,
          quantity: 10,
        },
        {
          id: "prod-2",
          name: "Product 2",
          description: "Budget-friendly option with essential features",
          price: 50,
          quantity: 20,
        },
        {
          id: "prod-3",
          name: "Product 3",
          description: "Luxury item with exclusive design",
          price: 200,
          quantity: 5,
        },
        {
          id: "prod-4",
          name: "Product 4",
          description: "Everyday use item with reliable performance",
          price: 75,
          quantity: 15,
        },
        {
          id: "prod-5",
          name: "Product 5",
          description: "Limited edition collector's item",
          price: 150,
          quantity: 3,
        },
      ],

      addProduct: (product) => {
        set((state) => ({
          products: [
            ...state.products,
            {
              ...product,
              id: `prod-${state.products.length + 1}`,
            },
          ],
        }))
      },

      updateProduct: (id, product) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
        }))
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }))
      },

      updateStock: (id, quantity) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, quantity: p.quantity + quantity } : p)),
        }))
      },
    }),
    {
      name: "inventory-storage",
    },
  ),
)

