import type { Cocktail } from "@/types/cocktail"
import type { PumpConfig } from "@/types/pump"

// Client-side functions that make API calls instead of direct file system access

export async function getAllCocktails(): Promise<Cocktail[]> {
  try {
    const response = await fetch("/api/cocktails")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error loading cocktails:", error)
    throw error
  }
}

export async function saveRecipe(cocktail: Cocktail): Promise<void> {
  try {
    const response = await fetch("/api/cocktails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cocktail),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || "Failed to save recipe")
    }
  } catch (error) {
    console.error("Error saving recipe:", error)
    throw error
  }
}

export async function deleteRecipe(cocktailId: string): Promise<void> {
  try {
    const response = await fetch(`/api/cocktails?id=${encodeURIComponent(cocktailId)}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || "Failed to delete recipe")
    }
  } catch (error) {
    console.error("Error deleting recipe:", error)
    throw error
  }
}

export async function makeCocktail(cocktail: Cocktail, pumpConfig: PumpConfig[], selectedSize: number): Promise<void> {
  console.log(`Making cocktail: ${cocktail.name} (${selectedSize}ml)`)

  // Calculate scaling factor
  const originalTotal = cocktail.recipe.reduce((sum, item) => sum + item.amount, 0)
  const scaleFactor = selectedSize / originalTotal

  // Scale recipe
  const scaledRecipe = cocktail.recipe.map((item) => ({
    ...item,
    amount: Math.round(item.amount * scaleFactor),
  }))

  console.log("Scaled recipe:", scaledRecipe)

  // Simulate cocktail making process
  for (let i = 0; i < scaledRecipe.length; i++) {
    const ingredient = scaledRecipe[i]
    const pump = pumpConfig.find((p) => p.ingredientId === ingredient.ingredientId)

    if (pump) {
      console.log(`Activating pump ${pump.pumpNumber} for ${ingredient.amount}ml of ${ingredient.ingredientId}`)

      // Calculate pump duration based on calibration
      const duration = Math.round((ingredient.amount / pump.mlPerSecond) * 1000)

      try {
        const response = await fetch("/api/gpio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "activate_pump",
            pump_number: pump.pumpNumber,
            duration: duration,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log(`Pump ${pump.pumpNumber} result:`, result)

        // Wait for pump to finish
        await new Promise((resolve) => setTimeout(resolve, duration + 100))
      } catch (error) {
        console.error(`Error activating pump ${pump.pumpNumber}:`, error)
        throw new Error(`Failed to activate pump for ${ingredient.ingredientId}`)
      }
    } else {
      console.warn(`No pump configured for ingredient: ${ingredient.ingredientId}`)
    }
  }

  console.log(`Cocktail ${cocktail.name} completed!`)
}

export async function activatePumpForDuration(pumpNumber: number, duration: number): Promise<void> {
  try {
    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "activate_pump",
        pump_number: pumpNumber,
        duration: duration,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log(`Pump ${pumpNumber} activated for ${duration}ms:`, result)
  } catch (error) {
    console.error(`Error activating pump ${pumpNumber}:`, error)
    throw error
  }
}

export async function makeSingleShot(ingredientId: string, amount: number, pumpConfig: PumpConfig[]): Promise<void> {
  const pump = pumpConfig.find((p) => p.ingredientId === ingredientId)

  if (!pump) {
    throw new Error(`No pump configured for ingredient: ${ingredientId}`)
  }

  console.log(`Making ${amount}ml shot of ${ingredientId} using pump ${pump.pumpNumber}`)

  // Calculate duration based on calibration
  const duration = Math.round((amount / pump.mlPerSecond) * 1000)

  await activatePumpForDuration(pump.pumpNumber, duration)
}

export async function getPumpConfig(): Promise<PumpConfig[]> {
  try {
    const response = await fetch("/api/pump-config")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error loading pump config:", error)
    // Return default config if API fails
    const { pumpConfig } = await import("@/data/pump-config")
    return pumpConfig
  }
}

export async function savePumpConfig(config: PumpConfig[]): Promise<void> {
  try {
    const response = await fetch("/api/pump-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || "Failed to save pump config")
    }
  } catch (error) {
    console.error("Error saving pump config:", error)
    throw error
  }
}

// Add missing functions for pump cleaning and calibration
export async function cleanPump(pumpId: number, duration: number): Promise<void> {
  await activatePumpForDuration(pumpId, duration)
}

export async function calibratePump(pumpId: number, duration: number): Promise<void> {
  await activatePumpForDuration(pumpId, duration)
}
