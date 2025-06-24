import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { cocktails as defaultCocktails } from "@/data/cocktails"

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

export async function POST() {
  await ensureDirectories()

  try {
    // Delete all saved cocktails
    const files = await fs.readdir(COCKTAILS_DIR)
    const cocktailFiles = files.filter((file) => file.endsWith(".json"))

    for (const file of cocktailFiles) {
      const filePath = path.join(COCKTAILS_DIR, file)
      await fs.unlink(filePath)
      console.log(`Deleted old cocktail file: ${file}`)
    }

    // Save all default cocktails (English) as individual files
    for (const cocktail of defaultCocktails) {
      const filePath = path.join(COCKTAILS_DIR, `${cocktail.id}.json`)
      await fs.writeFile(filePath, JSON.stringify(cocktail, null, 2))
    }

    console.log(`Reset complete! Saved ${defaultCocktails.length} English cocktails`)
    return NextResponse.json({ success: true, message: `Reset ${defaultCocktails.length} cocktails to English` })
  } catch (error) {
    console.error("Error resetting cocktails:", error)
    return NextResponse.json({ success: false, error: "Failed to reset cocktails" }, { status: 500 })
  }
}
