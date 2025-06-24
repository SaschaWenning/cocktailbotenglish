import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { cocktails as defaultCocktails } from "@/data/cocktails"
import type { Cocktail } from "@/types/cocktail"

const COCKTAILS_DIR = "/home/pi/cocktailbot/cocktailbot-main/data/saved-cocktails"

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(path.dirname(COCKTAILS_DIR), { recursive: true })
    await fs.mkdir(COCKTAILS_DIR, { recursive: true })
  } catch (error) {
    console.error("Error creating directories:", error)
  }
}

export async function GET() {
  await ensureDirectories()

  try {
    // Try to read saved cocktails
    const files = await fs.readdir(COCKTAILS_DIR)
    const cocktailFiles = files.filter((file) => file.endsWith(".json"))

    if (cocktailFiles.length === 0) {
      // No saved cocktails, return defaults (English)
      console.log("No saved cocktails found, using defaults (English)")
      return NextResponse.json(defaultCocktails)
    }

    // Load saved cocktails
    const savedCocktails: Cocktail[] = []
    for (const file of cocktailFiles) {
      try {
        const filePath = path.join(COCKTAILS_DIR, file)
        const content = await fs.readFile(filePath, "utf-8")
        const cocktail = JSON.parse(content)
        savedCocktails.push(cocktail)
      } catch (error) {
        console.error(`Error reading cocktail file ${file}:`, error)
      }
    }

    // If we have saved cocktails, use them, otherwise use defaults
    if (savedCocktails.length > 0) {
      console.log(`Loaded ${savedCocktails.length} saved cocktails`)
      return NextResponse.json(savedCocktails)
    } else {
      console.log("No valid saved cocktails, using defaults (English)")
      return NextResponse.json(defaultCocktails)
    }
  } catch (error) {
    console.error("Error loading cocktails:", error)
    // Fallback to default cocktails
    return NextResponse.json(defaultCocktails)
  }
}

export async function POST(request: NextRequest) {
  await ensureDirectories()

  try {
    const cocktail: Cocktail = await request.json()
    const filePath = path.join(COCKTAILS_DIR, `${cocktail.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(cocktail, null, 2))
    console.log(`Saved cocktail: ${cocktail.name}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving recipe:", error)
    return NextResponse.json({ success: false, error: "Failed to save recipe" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cocktailId = searchParams.get("id")

    if (!cocktailId) {
      return NextResponse.json({ success: false, error: "Missing cocktail ID" }, { status: 400 })
    }

    const filePath = path.join(COCKTAILS_DIR, `${cocktailId}.json`)
    await fs.unlink(filePath)
    console.log(`Deleted cocktail: ${cocktailId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting recipe:", error)
    return NextResponse.json({ success: false, error: "Failed to delete recipe" }, { status: 500 })
  }
}
