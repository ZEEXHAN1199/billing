import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CurrencyState {
  currencySymbol: string
  setCurrencySymbol: (symbol: string) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currencySymbol: "RS",
      setCurrencySymbol: (symbol) => set({ currencySymbol: symbol }),
    }),
    {
      name: "currency-storage",
    },
  ),
)

