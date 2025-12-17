import { makeCocktailAction } from "@/lib/cocktail-machine-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { cocktail, pumpConfig, size } = await request.json()

    // Use the original server action for Raspberry Pi
    const result = await makeCocktailAction(cocktail, pumpConfig, size)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error making cocktail:", error)
    return NextResponse.json({ success: false, error: "Failed to make cocktail" }, { status: 500 })
  }
}
