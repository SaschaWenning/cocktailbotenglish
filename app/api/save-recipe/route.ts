import { type NextRequest, NextResponse } from "next/server"
// import { saveRecipe } from "@/lib/cocktail-machine-server"

export async function POST(request: NextRequest) {
  try {
    const { cocktail } = await request.json()

    console.log("[v0] Recipe save requested (localStorage used in v0 preview):", cocktail.name)

    return NextResponse.json({
      success: true,
      message: "Recipe saved (in localStorage in v0 preview)",
    })
  } catch (error) {
    console.error("Error saving recipe:", error)
    return NextResponse.json({ success: false, error: "Failed to save recipe" }, { status: 500 })
  }
}
