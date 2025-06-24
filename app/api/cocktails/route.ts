import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { cocktails as defaultCocktails } from "@/data/cocktails"
import type { Cocktail } from "@/types/cocktail"

const COCKTAILS_PATH = path.join(process.cwd(), "data", "custom-cocktails.json")

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.promises.mkdir(path.dirname(COCKTAILS_PATH), { recursive: true })
  } catch (error) {
    console.error("Error creating directories:", error)
  }
}

export async function GET() {
  try {
    await ensureDirectories()

    // Load default cocktails
    let allCocktails = [...defaultCocktails]

    // Check if custom cocktails file exists
    if (fs.existsSync(COCKTAILS_PATH)) {
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      const customCocktails: Cocktail[] = JSON.parse(data)

      // Create a map to avoid duplicates (custom cocktails override defaults)
      const cocktailMap = new Map<string, Cocktail>()

      // Add default cocktails first
      for (const cocktail of allCocktails) {
        cocktailMap.set(cocktail.id, cocktail)
      }

      // Add/override with custom cocktails
      for (const cocktail of customCocktails) {
        cocktailMap.set(cocktail.id, cocktail)
      }

      allCocktails = Array.from(cocktailMap.values())
    }

    return NextResponse.json(allCocktails)
  } catch (error) {
    console.error("Error loading cocktails:", error)
    return NextResponse.json(defaultCocktails)
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories()

    const cocktail: Cocktail = await request.json()

    // Load existing custom cocktails or create empty array
    let customCocktails: Cocktail[] = []
    if (fs.existsSync(COCKTAILS_PATH)) {
      const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
      customCocktails = JSON.parse(data)
    }

    // Check if cocktail already exists
    const index = customCocktails.findIndex((c) => c.id === cocktail.id)

    if (index !== -1) {
      // Update existing cocktail
      customCocktails[index] = cocktail
    } else {
      // Add new cocktail
      customCocktails.push(cocktail)
    }

    // Save updated cocktails
    fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(customCocktails, null, 2), "utf8")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving cocktail:", error)
    return NextResponse.json({ success: false, error: "Failed to save cocktail" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cocktailId = searchParams.get("id")

    if (!cocktailId) {
      return NextResponse.json({ success: false, error: "Cocktail ID is required" }, { status: 400 })
    }

    // Check if custom cocktails file exists
    if (!fs.existsSync(COCKTAILS_PATH)) {
      return NextResponse.json({ success: false, error: "No custom cocktails found" }, { status: 404 })
    }

    // Load existing custom cocktails
    const data = fs.readFileSync(COCKTAILS_PATH, "utf8")
    const customCocktails: Cocktail[] = JSON.parse(data)

    // Find cocktail index
    const index = customCocktails.findIndex((c) => c.id === cocktailId)

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Cocktail not found" }, { status: 404 })
    }

    // Remove cocktail
    customCocktails.splice(index, 1)

    // Save updated cocktails
    fs.writeFileSync(COCKTAILS_PATH, JSON.stringify(customCocktails, null, 2), "utf8")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting cocktail:", error)
    return NextResponse.json({ success: false, error: "Failed to delete cocktail" }, { status: 500 })
  }
}
