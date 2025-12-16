import { ingredients as defaultIngredients } from "@/data/ingredients"
import type { Ingredient } from "@/types/pump"

export function getAllIngredients(): Ingredient[] {
  try {
    if (typeof window === "undefined") {
      return defaultIngredients
    }

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

export function getIngredientName(id: string): string {
  const ingredient = getIngredientById(id)
  if (ingredient) {
    return ingredient.name
  }

  if (id.startsWith("custom-")) {
    return id
      .replace(/^custom-/, "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
