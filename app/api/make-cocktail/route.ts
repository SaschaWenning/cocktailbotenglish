import { type NextRequest, NextResponse } from "next/server"
// import { makeCocktailAction } from "@/lib/cocktail-machine-server"

export async function POST(request: NextRequest) {
  try {
    const { cocktail, pumpConfig, size } = await request.json()

    console.log(`[v0] Making cocktail: ${cocktail.name} (${size})`)
    console.log("[v0] Ingredients:", cocktail.ingredients)

    // Simulate the cocktail making process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    return NextResponse.json({
      success: true,
      message: `${cocktail.name} prepared successfully (simulated in v0 preview)`,
    })
  } catch (error) {
    console.error("Error making cocktail:", error)
    return NextResponse.json({ success: false, error: "Failed to make cocktail" }, { status: 500 })
  }
}
