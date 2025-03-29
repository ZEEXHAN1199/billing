import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type Transaction = {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  date: string
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              transaction.type === "income"
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                : "bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-400",
            )}
          >
            {transaction.type === "income" ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.description}</p>
            <p className="text-xs text-muted-foreground">{transaction.date}</p>
          </div>
          <div
            className={cn(
              "font-medium",
              transaction.type === "income"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {transaction.type === "income" ? "+" : "-"}RS{transaction.amount.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

