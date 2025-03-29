import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { LogEntry } from "../types"

interface LogState {
  logs: LogEntry[]
  addLog: (log: LogEntry) => void
  clearLogs: () => void
}

export const useLogStore = create<LogState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) =>
        set((state) => ({
          logs: [log, ...state.logs],
        })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: "logs-storage",
    },
  ),
)

