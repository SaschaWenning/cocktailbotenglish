import { type NextRequest, NextResponse } from "next/server"
import { makeShotAction } from "@/lib/cocktail-machine-server"
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

    console.log(`[v0] Making shot: ${ingredient}, ${size}ml`)

    const pump = pumpConfig.find((p) => p.ingredient === ingredient)

    if (!pump) {
      return NextResponse.json(
        {
          success: false,
          error: `No pump configured for ingredient: ${ingredient}`,
        },
        { status: 404 },
      )
    }

    const result = await makeShotAction(ingredient, pumpConfig, size)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error making shot:", error)
    return NextResponse.json({ success: false, error: "Failed to make shot" }, { status: 500 })
  }
}
