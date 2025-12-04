import { getIngredientLevels } from "@/lib/ingredient-level-service"
import { pumpConfig } from "@/data/pump-config"
import type { Cocktail } from "@/types/cocktail"

export interface IngredientAvailability {
  canMake: boolean
  lowIngredients: string[] // Ingredients that are enough for exactly one cocktail
  missingIngredients: string[] // Ingredients that are not sufficient
}

export function checkCocktailAvailability(cocktail: Cocktail): IngredientAvailability {
  const levels = getIngredientLevels()
  const lowIngredients: string[] = []
  const missingIngredients: string[] = []

  console.log(`[v0] Checking availability for ${cocktail.name}`)
  console.log(`[v0] Current levels:`, levels)
  console.log(`[v0] Pump config:`, pumpConfig)

  // Only check automatic ingredients (those dispensed by the machine)
  const automaticIngredients = cocktail.recipe.filter((ingredient) => ingredient.type === "automatic")
  console.log(`[v0] Automatic ingredients for ${cocktail.name}:`, automaticIngredients)

  for (const ingredient of automaticIngredients) {
    // Find the corresponding pump for this ingredient
    const pump = pumpConfig.find((p) => p.ingredient === ingredient.ingredientId && p.enabled !== false)
    console.log(`[v0] Pump for ${ingredient.ingredientId}:`, pump)

    if (!pump) {
      // Ingredient is not configured or disabled
      console.log(`[v0] No pump found for ${ingredient.ingredientId}`)
      missingIngredients.push(ingredient.ingredientId)
      continue
    }

    // Find the current stock level for this pump
    const level = levels.find((l) => l.pumpId === pump.id)
    console.log(`[v0] Level for pump ${pump.id}:`, level)

    if (!level) {
      // No stock level found
      console.log(`[v0] No level found for pump ${pump.id}`)
      missingIngredients.push(ingredient.ingredientId)
      continue
    }

    const requiredAmount = ingredient.amount
    const availableAmount = level.currentLevel

    console.log(`[v0] ${ingredient.ingredientId}: required=${requiredAmount}ml, available=${availableAmount}ml`)

    if (availableAmount < requiredAmount) {
      // Not enough for this cocktail
      console.log(`[v0] Not enough ${ingredient.ingredientId} (${availableAmount} < ${requiredAmount})`)
      missingIngredients.push(ingredient.ingredientId)
    } else if (availableAmount < requiredAmount * 2) {
      // Enough for one cocktail, but low
      console.log(`[v0] Low ${ingredient.ingredientId} (${availableAmount} < ${requiredAmount * 2})`)
      lowIngredients.push(ingredient.ingredientId)
    } else {
      console.log(`[v0] Enough ${ingredient.ingredientId} (${availableAmount} >= ${requiredAmount * 2})`)
    }
  }

  const canMake = missingIngredients.length === 0

  const result = {
    canMake,
    lowIngredients,
    missingIngredients,
  }

  console.log(`[v0] Final availability for ${cocktail.name}:`, result)
  return result
}

export function getIngredientDisplayName(ingredientId: string): string {
  return ingredientId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
