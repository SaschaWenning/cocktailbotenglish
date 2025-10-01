import { type NextRequest, NextResponse } from "next/server"
// import { makeShotAction, getPumpConfig } from "@/lib/cocktail-machine-server"
import { pumpConfig as defaultPumpConfig } from "@/data/pump-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ingredient: string | undefined = body.ingredient ?? body.ingredientId
    const size: number = body.size ?? body.amount ?? 40
    const pumpConfig = body.pumpConfig ?? defaultPumpConfig

    if (!ingredient) {
      return NextResponse.json({ success: false, error: "Missing ingredient/ingredientId" }, { status: 400 })
    }

    console.log(`[v0] Making shot: ${ingredient}, ${size}ml (simulated in v0 preview)`)

    // Find the pump for this ingredient
    const pump = pumpConfig.pumps.find((p) => p.ingredientId === ingredient)

    if (!pump) {
      return NextResponse.json(
        {
          success: false,
          error: `No pump configured for ingredient: ${ingredient}`,
        },
        { status: 404 },
      )
    }

    // Simulate dispensing
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return NextResponse.json({
      success: true,
      message: `Shot of ${ingredient} (${size}ml) prepared successfully (simulated)`,
    })
  } catch (error) {
    console.error("Error making shot:", error)
    return NextResponse.json({ success: false, error: "Failed to make shot" }, { status: 500 })
  }
}
