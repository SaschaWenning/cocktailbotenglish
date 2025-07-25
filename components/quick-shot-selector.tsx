"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Check, AlertCircle, GlassWater } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { ingredients } from "@/data/ingredients"
import { makeSingleShot } from "@/lib/cocktail-machine"
import type { IngredientLevel } from "@/types/ingredient-level"

interface QuickShotSelectorProps {
  pumpConfig: PumpConfig[]
  ingredientLevels: IngredientLevel[]
  onShotComplete: () => Promise<void>
}

export default function QuickShotSelector({ pumpConfig, ingredientLevels, onShotComplete }: QuickShotSelectorProps) {
  const [isMaking, setIsMaking] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentIngredient, setCurrentIngredient] = useState<string>("")

  const shotSize = 20 // Fixed size: 20ml

  // Create a list of all available ingredients
  const getAllAvailableIngredients = () => {
    return pumpConfig.map((pump) => {
      const ingredient = ingredients.find((i) => i.id === pump.ingredient)
      return {
        id: pump.ingredient,
        name: ingredient?.name || pump.ingredient,
        alcoholic: ingredient?.alcoholic || false,
        pumpId: pump.id,
        hasPump: true,
      }
    })
  }

  const allAvailableIngredients = getAllAvailableIngredients()

  // Group ingredients by alcoholic and non-alcoholic
  const alcoholicIngredients = allAvailableIngredients.filter((i) => i.alcoholic)
  const nonAlcoholicIngredients = allAvailableIngredients.filter((i) => !i.alcoholic)

  const checkIngredientAvailable = (ingredientId: string) => {
    const level = ingredientLevels.find((level) => level.ingredientId === ingredientId)
    return level && level.currentAmount >= shotSize
  }

  const handleQuickShot = async (ingredientId: string) => {
    const ingredientName = ingredients.find((i) => i.id === ingredientId)?.name || ingredientId
    setCurrentIngredient(ingredientName)
    setIsMaking(true)
    setProgress(0)
    setStatusMessage(`Purging ${ingredientName}...`)
    setErrorMessage(null)

    let intervalId: NodeJS.Timeout

    try {
      // Simulate progress
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalId)
            return 100
          }
          return prev + 10
        })
      }, 200)

      // Prepare the shot
      await makeSingleShot(ingredientId, shotSize)

      clearInterval(intervalId)
      setProgress(100)
      setStatusMessage(`${ingredientName} ready!`)
      setShowSuccess(true)

      // Update fill levels after successful preparation
      await onShotComplete()

      setTimeout(() => {
        setIsMaking(false)
        setShowSuccess(false)
        setCurrentIngredient("")
      }, 3000)
    } catch (error) {
      clearInterval(intervalId)
      setProgress(0)
      setStatusMessage("Error during preparation!")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      setTimeout(() => {
        setIsMaking(false)
        setCurrentIngredient("")
      }, 3000)
    }
  }

  if (isMaking) {
    return (
      <Card className="border-[hsl(var(--cocktail-card-border))] bg-black text-[hsl(var(--cocktail-text))]">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--cocktail-primary))]/10 flex items-center justify-center">
              <GlassWater className="h-10 w-10 text-[hsl(var(--cocktail-primary))]" />
            </div>
            <h2 className="text-xl font-semibold text-center">{statusMessage}</h2>
          </div>
          <Progress value={progress} className="h-2" />

          {errorMessage && (
            <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
              <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
              <AlertDescription className="text-[hsl(var(--cocktail-error))]">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {showSuccess && (
            <div className="flex justify-center">
              <div className="rounded-full bg-[hsl(var(--cocktail-success))]/20 p-3">
                <Check className="h-8 w-8 text-[hsl(var(--cocktail-success))]" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--cocktail-text))]">Purge Alcoholic Ingredients</h2>
        <div className="grid grid-cols-4 gap-3">
          {alcoholicIngredients.map((ingredient) => {
            const isAvailable = checkIngredientAvailable(ingredient.id)

            return (
              <Button
                key={ingredient.id}
                variant="outline"
                className={`h-auto py-3 px-3 justify-center text-center transition-all duration-200 ${
                  isAvailable
                    ? "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black hover:scale-105"
                    : "bg-[hsl(var(--cocktail-card-bg))]/50 text-[hsl(var(--cocktail-text))]/50 border-[hsl(var(--cocktail-card-border))]/50 cursor-not-allowed"
                }`}
                onClick={() => handleQuickShot(ingredient.id)}
                disabled={!isAvailable}
              >
                <div className="flex flex-col items-center">
                  <span className="font-medium text-sm">{ingredient.name}</span>
                  {!isAvailable && <span className="text-xs text-[hsl(var(--cocktail-warning))] mt-1">Empty</span>}
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {nonAlcoholicIngredients.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-[hsl(var(--cocktail-text))]">
            Purge Non-Alcoholic Ingredients
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {nonAlcoholicIngredients.map((ingredient) => {
              const isAvailable = checkIngredientAvailable(ingredient.id)

              return (
                <Button
                  key={ingredient.id}
                  variant="outline"
                  className={`h-auto py-3 px-3 justify-center text-center transition-all duration-200 ${
                    isAvailable
                      ? "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black hover:scale-105"
                      : "bg-[hsl(var(--cocktail-card-bg))]/50 text-[hsl(var(--cocktail-text))]/50 border-[hsl(var(--cocktail-card-border))]/50 cursor-not-allowed"
                  }`}
                  onClick={() => handleQuickShot(ingredient.id)}
                  disabled={!isAvailable}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-sm">{ingredient.name}</span>
                    {!isAvailable && <span className="text-xs text-[hsl(var(--cocktail-warning))] mt-1">Empty</span>}
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
