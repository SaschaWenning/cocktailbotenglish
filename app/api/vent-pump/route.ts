import { type NextRequest, NextResponse } from "next/server"
// import { ventPumpAction } from "@/lib/cocktail-machine-server"

export async function POST(request: NextRequest) {
  try {
    const { pumpId, durationMs } = await request.json()

    console.log(`[v0] Vent pump request: pumpId=${pumpId}, duration=${durationMs}ms (simulated in v0 preview)`)

    await new Promise((resolve) => setTimeout(resolve, durationMs))

    return NextResponse.json({
      success: true,
      message: `Pump ${pumpId} vented for ${durationMs}ms (simulated)`,
    })
  } catch (error) {
    console.error("Error venting pump:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to vent pump",
      },
      { status: 500 },
    )
  }
}
