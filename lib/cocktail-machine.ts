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

  // Separate grenadine from other ingredients
  const grenadineItems = scaledRecipe.filter((item) => item.ingredientId === "grenadine")
  const otherItems = scaledRecipe.filter((item) => item.ingredientId !== "grenadine")

  // Activate all pumps except grenadine simultaneously
  const otherPumpPromises = otherItems.map((item) => {
    const pump = pumpConfig.find((p) => p.ingredient === item.ingredientId)

    if (!pump) {
      console.warn(`No pump configured for ingredient: ${item.ingredientId}`)
      return Promise.resolve()
    }

    // Calculate pump duration based on calibration
    const duration = Math.round((item.amount / pump.flowRate) * 1000)

    console.log(`Activating pump ${pump.id} (pin ${pump.pin}) for ${item.amount}ml (${duration}ms)`)

    return activatePumpForDuration(pump.pin, duration)
  })

  // Wait for all other pumps to finish
  await Promise.all(otherPumpPromises)

  // If grenadine is in the recipe, wait 2 seconds and add it
  if (grenadineItems.length > 0) {
    console.log("Waiting 2 seconds before adding grenadine...")
    await new Promise((resolve) => setTimeout(resolve, 2000))

    for (const item of grenadineItems) {
      const pump = pumpConfig.find((p) => p.ingredient === item.ingredientId)

      if (!pump) {
        console.warn(`No pump configured for ingredient: ${item.ingredientId}`)
        continue
      }

      const duration = Math.round((item.amount / pump.flowRate) * 1000)

      console.log(`Adding grenadine: pump ${pump.id} (pin ${pump.pin}) for ${item.amount}ml (${duration}ms)`)

      await activatePumpForDuration(pump.pin, duration)
    }
  }

  console.log(`Cocktail ${cocktail.name} completed!`)
}

export async function activatePumpForDuration(pin: number, duration: number): Promise<void> {
  try {
    console.log(`Activating pump at pin ${pin} for ${duration}ms`)

    const response = await fetch("/api/gpio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "activate",
        pin: pin,
        duration: duration,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log(`Pump at pin ${pin} result:`, result)

    if (!result.success) {
      throw new Error(result.error || "Failed to activate pump")
    }
  } catch (error) {
    console.error(`Error activating pump at pin ${pin}:`, error)
    throw error
  }
}

export async function makeSingleShot(ingredientId: string, amount: number, pumpConfig: PumpConfig[]): Promise<void> {
  const pump = pumpConfig.find((p) => p.ingredient === ingredientId)

  if (!pump) {
    throw new Error(`No pump configured for ingredient: ${ingredientId}`)
  }

  console.log(`Making ${amount}ml shot of ${ingredientId} using pump ${pump.id} (pin ${pump.pin})`)

  // Calculate duration based on calibration
  const duration = Math.round((amount / pump.flowRate) * 1000)

  await activatePumpForDuration(pump.pin, duration)
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
  // Find the pump configuration to get the pin
  const pumpConfig = await getPumpConfig()
  const pump = pumpConfig.find((p) => p.id === pumpId)

  if (!pump) {
    throw new Error(`Pump with ID ${pumpId} not found`)
  }

  await activatePumpForDuration(pump.pin, duration)
}

export async function calibratePump(pumpId: number, duration: number): Promise<void> {
  // Find the pump configuration to get the pin
  const pumpConfig = await getPumpConfig()
  const pump = pumpConfig.find((p) => p.id === pumpId)

  if (!pump) {
    throw new Error(`Pump with ID ${pumpId} not found`)
  }

  await activatePumpForDuration(pump.pin, duration)
}
