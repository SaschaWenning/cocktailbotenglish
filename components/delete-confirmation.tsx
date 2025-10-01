"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AlphaKeyboard from "./alpha-keyboard"

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  cocktailName: string
}

export default function DeleteConfirmation({ isOpen, onClose, onConfirm, cocktailName }: DeleteConfirmationProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showKeyboard, setShowKeyboard] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setPassword("")
      setError(false)
      setShowKeyboard(true)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password === "cocktail") {
      setError(false)
      setIsDeleting(true)

      try {
        await onConfirm()
        setPassword("")
        onClose()
      } catch (error) {
        console.error("Error deleting:", error)
      } finally {
        setIsDeleting(false)
      }
    } else {
      setError(true)
    }
  }

  const handleKeyPress = (key: string) => {
    setPassword((prev) => prev + key)
    setError(false)
  }

  const handleBackspace = () => {
    setPassword((prev) => prev.slice(0, -1))
    setError(false)
  }

  const handleClear = () => {
    setPassword("")
    setError(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-[hsl(var(--cocktail-text))] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--cocktail-error))]" />
            Delete Cocktail
          </DialogTitle>
        </DialogHeader>

        <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
          <AlertDescription className="text-[hsl(var(--cocktail-text))]">
            Do you really want to delete the cocktail <strong>{cocktailName}</strong>? This action cannot be undone.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Please enter the password to confirm deletion:</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`bg-[hsl(var(--cocktail-bg))] border-[hsl(var(--cocktail-card-border))] ${error ? "border-[hsl(var(--cocktail-error))]" : ""}`}
              placeholder="Enter password"
              autoComplete="off"
              readOnly
              onFocus={() => setShowKeyboard(true)}
            />
            {error && (
              <p className="text-[hsl(var(--cocktail-error))] text-sm">Incorrect password. Please try again.</p>
            )}
          </div>

          {showKeyboard && (
            <div className="mt-4">
              <AlphaKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
                onConfirm={handleSubmit}
                onCancel={onClose}
              />
            </div>
          )}

          {isDeleting && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Deleting...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
