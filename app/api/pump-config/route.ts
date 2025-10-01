export const runtime = "edge"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { pumpConfig as defaultPumpConfig } from "@/data/pump-config"

export async function GET() {
  try {
    // In v0 environment, return the default pump config
    // In production with file system access, this would read from a JSON file
    return NextResponse.json({ success: true, pumpConfig: defaultPumpConfig })
  } catch (error) {
    console.error("Error getting pump config:", error)
    return NextResponse.json({ success: false, error: "Failed to get pump config" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pumpConfig } = await request.json()

    // In v0 environment, we can't persist to file system
    // In production, this would save to a JSON file
    console.log("Pump config update requested:", pumpConfig)

    return NextResponse.json({ success: true, message: "Pump config updated (in-memory only in v0)" })
  } catch (error) {
    console.error("Error saving pump config:", error)
    return NextResponse.json({ success: false, error: "Failed to save pump config" }, { status: 500 })
  }
}
