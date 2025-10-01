import { type NextRequest, NextResponse } from "next/server"
import { calibratePumpAction } from "@/lib/cocktail-machine-server"

export async function POST(request: NextRequest) {
  try {
    const { pumpId, durationMs } = await request.json()

    console.log(`[v0] Calibrating pump ${pumpId} for ${durationMs}ms`)

    const result = await calibratePumpAction(pumpId, durationMs)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error calibrating pump:", error)
    return NextResponse.json({ success: false, error: "Failed to calibrate pump" }, { status: 500 })
  }
}
