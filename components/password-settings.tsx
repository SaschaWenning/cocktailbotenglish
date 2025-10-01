"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Key, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AlphaKeyboard from "./alpha-keyboard"

export default function PasswordSettings() {
  const [customPassword, setCustomPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showKeyboardModal, setShowKeyboardModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadCustomPassword = () => {
      try {
        const savedPassword = localStorage.getItem("customPassword")
        if (savedPassword) {
          setCustomPassword(savedPassword)
        }
      } catch (error) {
        console.error("Error loading custom password:", error)
      }
    }

    loadCustomPassword()
  }, [])

  const handleSavePassword = () => {
    try {
      localStorage.setItem("customPassword", newPassword)
      setCustomPassword(newPassword)
      setNewPassword("")
      setIsEditing(false)
      setShowKeyboardModal(false)
      toast({
        title: "Password Saved",
        description: "The custom password has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving password:", error)
      toast({
        title: "Error",
        description: "The password could not be saved.",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (key: string) => {
    setNewPassword((prev) => prev + key)
  }

  const handleBackspace = () => {
    setNewPassword((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setNewPassword("")
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setNewPassword(customPassword)
    setShowKeyboardModal(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setNewPassword("")
    setShowKeyboardModal(false)
  }

  const handleCloseModal = () => {
    setShowKeyboardModal(false)
    setIsEditing(false)
    setNewPassword("")
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(var(--cocktail-text))]">
            <Key className="h-5 w-5" />
            Password Settings
          </CardTitle>
          <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
            Manage your custom password for accessing settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[hsl(var(--cocktail-text))]">Current Custom Password:</Label>
            <div className="flex items-center gap-2">
              <Input
                type={showPassword ? "text" : "password"}
                value={customPassword || "No custom password set"}
                readOnly
                className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))]"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            onClick={handleStartEdit}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            Enter Password
          </Button>

          <div className="mt-6 p-4 bg-[hsl(var(--cocktail-bg))] rounded-lg border border-[hsl(var(--cocktail-card-border))]">
            <h4 className="text-sm font-medium text-[hsl(var(--cocktail-text))] mb-2">Important Notes:</h4>
            <ul className="text-sm text-[hsl(var(--cocktail-text-muted))] space-y-1">
              <li>• The master password "cocktail" always works as a fallback</li>
              <li>• Your custom password will be accepted additionally</li>
              <li>• Keep your password safe</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showKeyboardModal} onOpenChange={handleCloseModal}>
        <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Enter Password
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--cocktail-text))]">New Password:</Label>
              <Input
                type="password"
                value={newPassword}
                placeholder="Enter new password"
                className="bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))]"
                readOnly
              />
            </div>

            <div className="mt-4">
              <AlphaKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
                onConfirm={handleSavePassword}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
