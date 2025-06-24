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
  // ALWAYS return the current cocktails from cocktails.ts
  // This ensures we always get the latest English version
  console.log("Loading cocktails from cocktails.ts (English)")
  return NextResponse.json(defaultCocktails)
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
