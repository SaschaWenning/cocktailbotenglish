import { NextResponse } from "next/server"
import { pumpConfig as defaultPumpConfig } from "@/data/pump-config"
import type { PumpConfig } from "@/types/pump"
import fs from "fs"
import path from "path"

const PUMP_CONFIG_PATH = path.join(process.cwd(), "data", "pump-config.json")

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.promises.mkdir(path.dirname(PUMP_CONFIG_PATH), { recursive: true })
  } catch (error) {
    console.error("Error creating directories:", error)
  }
}

export async function GET() {
  try {
    await ensureDirectories()

    // Check if pump config file exists
    if (fs.existsSync(PUMP_CONFIG_PATH)) {
      const data = fs.readFileSync(PUMP_CONFIG_PATH, "utf8")
      const pumpConfig: PumpConfig[] = JSON.parse(data)
      return NextResponse.json(pumpConfig)
    } else {
      // Save default config and return it
      fs.writeFileSync(PUMP_CONFIG_PATH, JSON.stringify(defaultPumpConfig, null, 2), "utf8")
      return NextResponse.json(defaultPumpConfig)
    }
  } catch (error) {
    console.error("Error loading pump config:", error)
    return NextResponse.json(defaultPumpConfig)
  }
}

export async function POST(request: Request) {
  try {
    await ensureDirectories()

    const pumpConfig: PumpConfig[] = await request.json()

    // Save pump configuration
    fs.writeFileSync(PUMP_CONFIG_PATH, JSON.stringify(pumpConfig, null, 2), "utf8")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving pump config:", error)
    return NextResponse.json({ success: false, error: "Failed to save pump config" }, { status: 500 })
  }
}
