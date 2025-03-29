import { create } from "zustand"
import type { CompanyInfo } from "../types"

interface CompanyInfoState {
  companyInfo: CompanyInfo
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void
  setCompanyLogo: (logo: string) => void
}

export const useCompanyInfoStore = create<CompanyInfoState>((set) => ({
  companyInfo: {
    logo: "",
    name: "Zeeshan Engineering Works",
    quote: "We deal in all kinds of shoe machinery.",
    address: "Near Alsaeed Chowk, Varat, Shahdara, Lahore.",
    phone1: "923004827226",
    phone2: "923087860012",
    email: "zeeshanengineeringworks@gmail.com",
    site: "www.mycompany.com",
    proprietor: "Shamas ud Din",
  },
  updateCompanyInfo: (info) =>
    set((state) => ({
      companyInfo: { ...state.companyInfo, ...info },
    })),
  setCompanyLogo: (logo) =>
    set((state) => ({
      companyInfo: { ...state.companyInfo, logo },
    })),
}))

