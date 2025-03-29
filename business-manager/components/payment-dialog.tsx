"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { usePaymentStore } from "@/lib/stores/payment-store"
import { useToast } from "@/components/ui/use-toast"
import { useLogStore } from "@/lib/stores/log-store"
import { useCurrencyStore } from "@/lib/stores/currency-store"
import type { PaymentDirection } from "@/lib/payment-types"

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  direction: z.enum(["incoming", "outgoing"]),
  method: z.enum(["cash", "bank", "check", "online", "credit", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  discount: z.coerce.number().min(0, "Discount cannot be negative").optional(),
  tax: z.coerce.number().min(0, "Tax cannot be negative").optional(),
  date: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type PaymentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  relatedId: string
  relatedType: "customer" | "supplier" | "manufacturing"
  entityName: string
  defaultDirection?: PaymentDirection
  onSuccess?: () => void
  maxAmount?: number
}

export function PaymentDialog({
  open,
  onOpenChange,
  relatedId,
  relatedType,
  entityName,
  defaultDirection = "incoming",
  onSuccess,
  maxAmount,
}: PaymentDialogProps) {
  const { toast } = useToast()
  const { addLog } = useLogStore()
  const { addPayment } = usePaymentStore()
  const { currencySymbol } = useCurrencyStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: maxAmount || 0,
      direction: defaultDirection,
      method: "cash",
      reference: "",
      notes: "",
      discount: 0,
      tax: 0,
      date: new Date().toISOString().split("T")[0],
    },
  })

  const handleSubmit = (values: FormValues) => {
    // Add payment
    const paymentId = addPayment({
      ...values,
      date: values.date || new Date().toISOString(),
      relatedId,
      relatedType,
    })

    // Add log
    addLog({
      action: `${values.direction}_payment`,
      details: `${values.direction === "incoming" ? "Received" : "Sent"} ${currencySymbol}${values.amount} ${
        values.direction === "incoming" ? "from" : "to"
      } ${entityName} via ${values.method}`,
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Payment recorded",
      description: `${values.direction === "incoming" ? "Incoming" : "Outgoing"} payment of ${currencySymbol}${
        values.amount
      } has been recorded`,
    })

    // Reset form and close dialog
    form.reset()
    onOpenChange(false)

    // Call success callback if provided
    if (onSuccess) {
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="incoming">Incoming (Receive)</SelectItem>
                        <SelectItem value="outgoing">Outgoing (Pay)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="online">Online Payment</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Check number, transaction ID, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional details about this payment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

