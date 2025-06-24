import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { PumpConfig } from "@/types/pump"

const PUMP_CONFIG_FILE = "/home/pi/cocktailbot/cocktailbot-main/data/pump-config.json"

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(path.dirname(PUMP_CONFIG_FILE), { recursive: true })
  } catch (error) {
    console.error("Error creating directories:", error)
  }
}

export async function GET() {
  await ensureDirectories()

  try {
    const content = await fs.readFile(PUMP_CONFIG_FILE, "utf-8")
    return NextResponse.json(JSON.parse(content))
  } catch (error) {
    console.error("Error loading pump config:", error)
    // Return default config if file doesn't exist
    const { pumpConfig } = await import("@/data/pump-config")
    return NextResponse.json(pumpConfig)
  }
}

export async function POST(request: NextRequest) {
  await ensureDirectories()

  try {
    const config: PumpConfig[] = await request.json()
    await fs.writeFile(PUMP_CONFIG_FILE, JSON.stringify(config, null, 2))
    console.log("Pump configuration saved")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving pump config:", error)
    return NextResponse.json({ success: false, error: "Failed to save pump config" }, { status: 500 })
  }
}
