import { type NextRequest, NextResponse } from "next/server"
import { makeCocktailAction } from "@/lib/cocktail-machine-server"

export async function POST(request: NextRequest) {
  try {
    const { cocktail, pumpConfig, size } = await request.json()

    console.log(`[v0] Making cocktail: ${cocktail.name} (${size})`)
    console.log("[v0] Ingredients:", cocktail.ingredients)

    await makeCocktailAction(cocktail, pumpConfig, size)

    return NextResponse.json({
      success: true,
      message: `${cocktail.name} prepared successfully`,
    })
  } catch (error) {
    console.error("Error making cocktail:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to make cocktail",
      },
      { status: 500 },
    )
  }
}
