"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useCompanyInfoStore } from "@/lib/stores/company-info-store"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CompanyInfoModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const { companyInfo, updateCompanyInfo, setCompanyLogo } = useCompanyInfoStore()
  const [formData, setFormData] = useState(companyInfo)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(companyInfo.logo || null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setLogoPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id.replace("company-", "")]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Update company info
    updateCompanyInfo(formData)

    // Update logo if changed
    if (logoPreview && logoPreview !== companyInfo.logo) {
      setCompanyLogo(logoPreview)
    }

    toast({
      title: "Company info updated",
      description: "Your company information has been saved successfully",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Company Info</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <form id="company-info-form" onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="company-logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview && (
                    <div className="relative w-16 h-16 border rounded overflow-hidden">
                      <Image
                        src={logoPreview || "/placeholder.svg"}
                        alt="Company logo preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <Input
                    id="company-logo"
                    type="file"
                    accept="image/*"
                    ref={logoInputRef}
                    onChange={handleLogoChange}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company-quote">Company Quote/Intro</Label>
                <Textarea
                  id="company-quote"
                  value={formData.quote}
                  onChange={handleInputChange}
                  placeholder="Enter company quote or intro"
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company-address">Address</Label>
                <Textarea
                  id="company-address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter company address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company-phone1">Phone Number 1</Label>
                  <Input
                    id="company-phone1"
                    value={formData.phone1}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="company-phone2">Phone Number 2</Label>
                  <Input
                    id="company-phone2"
                    value={formData.phone2}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company-site">Website</Label>
                <Input
                  id="company-site"
                  value={formData.site}
                  onChange={handleInputChange}
                  placeholder="Enter website URL"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company-site">Website</Label>
                <Input
                  id="company-site"
                  value={formData.site}
                  onChange={handleInputChange}
                  placeholder="Enter website URL"
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="submit" form="company-info-form">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

