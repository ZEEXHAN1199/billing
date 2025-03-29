"use client"

import { useState } from "react"
import { CalendarIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useCurrencyStore } from "@/lib/stores/currency-store"

type Customer = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  totalSpent: number
  lastPurchase: string
}

type CartItem = {
  id: string
  name: string
  quantity: number
  price: number
  total: number
}

const formSchema = z.object({
  date: z.date(),
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1, "Customer name is required"),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Item name is required"),
        quantity: z.coerce.number().positive("Quantity must be positive"),
        price: z.coerce.number().positive("Price must be positive"),
      }),
    )
    .min(1, "At least one item is required"),
  discount: z.coerce.number().min(0, "Discount cannot be negative"),
  amountPaid: z.coerce.number().min(0, "Amount paid cannot be negative"),
})

type FormValues = z.infer<typeof formSchema>

type BillDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: any) => void
  customers: Customer[]
  cartItems: CartItem[]
}

export function BillDialog({ open, onOpenChange, onSubmit, customers, cartItems }: BillDialogProps) {
  const { currencySymbol } = useCurrencyStore()
  const [subtotal, setSubtotal] = useState(0)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      customerId: "",
      customerName: "",
      items:
        cartItems.length > 0
          ? cartItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            }))
          : [{ name: "", quantity: 1, price: 0 }],
      discount: 0,
      amountPaid: 0,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Calculate subtotal whenever items change
  const calculateSubtotal = () => {
    const items = form.getValues("items")
    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    setSubtotal(total)
    return total
  }

  const handleSubmit = (values: FormValues) => {
    const calculatedSubtotal = calculateSubtotal()
    const total = calculatedSubtotal - values.discount
    const balance = total - values.amountPaid

    onSubmit({
      customerId: values.customerId,
      customerName: values.customerName,
      date: format(values.date, "MMM dd, yyyy"),
      items: values.items.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
      subtotal: calculatedSubtotal,
      discount: values.discount,
      total: total,
      amountPaid: values.amountPaid,
      balance: balance,
    })

    form.reset()
  }

  // Update customer name when customer ID changes
  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      form.setValue("customerName", customer.name)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
          <DialogDescription>Enter the bill details below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleCustomerChange(value)
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Items</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", quantity: 1, price: 0 })}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end mb-2">
                  <FormField
                    control={form.control}
                    name={`items.RS{index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={cn(index !== 0 && "sr-only")}>Item</FormLabel>
                        <FormControl>
                          <Input placeholder="Item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.RS{index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormLabel className={cn(index !== 0 && "sr-only")}>Qty</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber)
                              calculateSubtotal()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.RS{index}.price`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel className={cn(index !== 0 && "sr-only")}>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber)
                              calculateSubtotal()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      fields.length > 1 && remove(index)
                      calculateSubtotal()
                    }}
                    disabled={fields.length <= 1}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.items?.root && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.items.root.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        step={0.01}
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
                name="amountPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
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

            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Subtotal:</span>
              <span className="font-bold">
                {currencySymbol}
                {subtotal.toLocaleString()}
              </span>
            </div>

            <DialogFooter>
              <Button type="submit">Create Bill</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

