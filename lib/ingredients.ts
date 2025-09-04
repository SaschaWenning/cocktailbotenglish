import { ingredients as defaultIngredients } from "@/data/ingredients"
import type { Ingredient } from "@/types/pump"

export function getAllIngredients(): Ingredient[] {
  if (typeof window === "undefined") {
    // During SSR, only return default ingredients
    return defaultIngredients
  }

  try {
    const customIngredients = localStorage.getItem("customIngredients")
    const custom: Ingredient[] = customIngredients ? JSON.parse(customIngredients) : []
    return [...defaultIngredients, ...custom]
  } catch (error) {
    console.error("Error loading ingredients:", error)
    return defaultIngredients
  }
}

export function getIngredientById(id: string): Ingredient | undefined {
  return getAllIngredients().find((ingredient) => ingredient.id === id)
}
