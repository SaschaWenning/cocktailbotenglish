import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pumpId, durationMs } = await request.json()

    // In the v0 preview environment, we simulate the calibration
    // In production, this would trigger the actual GPIO control
    console.log(`[v0] Calibrating pump ${pumpId} for ${durationMs}ms`)

    // Simulate a successful calibration
    await new Promise((resolve) => setTimeout(resolve, durationMs))

    return NextResponse.json({
      success: true,
      message: `Pump ${pumpId} calibrated for ${durationMs}ms`,
    })
  } catch (error) {
    console.error("Error calibrating pump:", error)
    return NextResponse.json({ success: false, error: "Failed to calibrate pump" }, { status: 500 })
  }
}
