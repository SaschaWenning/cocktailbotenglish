import { type NextRequest, NextResponse } from "next/server"
// import { deleteRecipe } from "@/lib/cocktail-machine-server"

export async function POST(request: NextRequest) {
  try {
    const { cocktailId } = await request.json()

    if (!cocktailId) {
      return NextResponse.json({ error: "Cocktail ID is required" }, { status: 400 })
    }

    console.log("[v0] API: Deleting cocktail (localStorage used in v0 preview):", cocktailId)

    // Return success and let client handle the deletion
    return NextResponse.json({
      success: true,
      message: "Recipe deleted (from localStorage in v0 preview)",
      cocktailId,
    })
  } catch (error) {
    console.error("[v0] Error deleting cocktail:", error)
    return NextResponse.json({ error: "Failed to delete cocktail" }, { status: 500 })
  }
}
