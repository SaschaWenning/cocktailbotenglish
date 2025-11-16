"use client"

import { Button } from "@/components/ui/button"
import { Backpack as Backspace, X, Check } from 'lucide-react'

interface AlphaKeyboardProps {
  onKeyPress: (key: string) => void
  onBackspace: () => void
  onClear: () => void
  onConfirm: () => void
  onCancel?: () => void // Füge optionale onCancel Funktion hinzu
}

export default function AlphaKeyboard({ onKeyPress, onBackspace, onClear, onConfirm, onCancel }: AlphaKeyboardProps) {
  // First row: q to p (10 keys)
  const row1 = ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p"]
  // Second row: a to l (9 keys)
  const row2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"]
  // Third row: y to m (7 keys) - y and z swapped for German layout
  const row3 = ["y", "x", "c", "v", "b", "n", "m"]

  return (
    <div className="bg-black border border-[hsl(var(--cocktail-card-border))] rounded-lg p-1.5 shadow-lg max-w-sm mx-auto">
      {/* First row - 10 keys */}
      <div className="grid grid-cols-10 gap-0.5 mb-0.5">
        {row1.map((key) => (
          <Button
            key={key}
            className="h-6 text-xs font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))] active:bg-[hsl(var(--cocktail-primary))] active:text-black transition-colors"
            onClick={() => onKeyPress(key)}
          >
            {key.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-10 gap-0.5 mb-0.5">
        <div className="col-span-1"></div>
        {row2.map((key) => (
          <Button
            key={key}
            className="h-6 text-xs font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] hover:text-[hsl(var(--cocktail-primary))] active:bg-[hsl(var(--cocktail-primary))] active:text-black transition-colors"
            onClick={() => onKeyPress(key)}
          >
            {key.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-10 gap-0.5 mb-1">
        <div className="col-span-1"></div>
        <div className="col-span-1"></div>
        {row3.map((key) => (
          <Button
            key={key}
            className="h-6 text-xs font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] active:bg-[hsl(var(--cocktail-primary))] active:text-black transition-colors"
            onClick={() => onKeyPress(key)}
          >
            {key.toUpperCase()}
          </Button>
        ))}
        <div className="col-span-1"></div>
      </div>

      <div className="grid grid-cols-10 gap-0.5 mb-1">
        <div className="col-span-2"></div>
        <Button
          className="col-span-6 h-6 text-xs font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] active:bg-[hsl(var(--cocktail-primary))] active:text-black transition-colors"
          onClick={() => onKeyPress(" ")}
        >
          SPACE
        </Button>
        <div className="col-span-2"></div>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <Button
          className="h-6 text-xs font-medium text-[hsl(var(--cocktail-error))] bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-error))]/20 active:bg-[hsl(var(--cocktail-error))]/30 transition-colors"
          onClick={onClear}
        >
          <X className="h-2 w-2 mr-1" />
          Clear
        </Button>

        <Button
          className="h-6 text-xs font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] active:bg-[hsl(var(--cocktail-primary))] active:text-black transition-colors"
          onClick={onBackspace}
        >
          <Backspace className="h-2 w-2 mr-1" />
          Back
        </Button>

        {onCancel && (
          <Button
            className="h-6 text-xs font-medium bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] active:bg-[hsl(var(--cocktail-error))] active:text-white transition-colors"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}

        <Button
          className={`${onCancel ? "col-span-1" : "col-span-2"} h-6 text-xs font-medium bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))] active:bg-[hsl(var(--cocktail-primary-hover))] transition-colors`}
          onClick={onConfirm}
        >
          <Check className="h-3 w-3 mr-1" />
          Confirm
        </Button>
      </div>
    </div>
  )
}
