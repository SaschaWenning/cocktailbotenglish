import { type NextRequest, NextResponse } from "next/server"
import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"

const execFileAsync = promisify(execFile)

async function runLed(...args: string[]): Promise<void> {
  const scriptPath = path.join(process.cwd(), "led_client.py")
  console.log("[v0] LED command:", { scriptPath, args })
  try {
    const result = await execFileAsync("python3", [scriptPath, ...args])
    console.log("[v0] LED command success:", result)
  } catch (error) {
    console.error("[v0] LED command failed:", error)
    throw error
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

export async function POST(request: NextRequest) {
  try {
    const { mode, color, brightness, blinking, scheme } = await request.json()

    console.log("[v0] Lighting control POST request:", { mode, color, brightness, blinking, scheme })

    if (mode === "brightness" && brightness !== undefined) {
      await runLed("BRIGHT", String(brightness))
      console.log(`[v0] LED Brightness set to: ${brightness}`)
      return NextResponse.json({ success: true })
    }

    if (brightness !== undefined) {
      await runLed("BRIGHT", String(brightness))
      console.log(`[v0] LED Brightness set to: ${brightness}`)
    }

    await sendLightingControlCommand(mode, color, brightness, blinking, scheme)

    console.log("[v0] Lighting control command sent successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error controlling lighting:", error)
    return NextResponse.json({ error: "Failed to control lighting" }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("[v0] Lighting control GET request - testing with rainbow")
    await runLed("RAINBOW", "30")
    return NextResponse.json({ success: true, message: "Rainbow test started" })
  } catch (error) {
    console.error("[v0] Error testing lighting:", error)
    return NextResponse.json({ error: "Failed to test lighting" }, { status: 500 })
  }
}

async function loadIdleConfig() {
  try {
    const configResponse = await fetch("http://localhost:3000/api/lighting-config")
    if (configResponse.ok) {
      const config = await configResponse.json()
      return config.idleMode
    }
  } catch (error) {
    console.error("[v0] Error loading idle config:", error)
  }
  return { scheme: "static", colors: ["#ffffff"] }
}

async function sendLightingControlCommand(
  mode: string,
  color?: string,
  brightness?: number,
  blinking?: boolean,
  scheme?: string,
) {
  try {
    switch (mode) {
      case "cocktailPreparation":
      case "preparation":
        try {
          const rgb = { r: 255, g: 0, b: 0 } // Red color
          await runLed("BLINK", String(rgb.r), String(rgb.g), String(rgb.b))
          console.log(`[v0] LED Mode: Preparation (RED BLINK RGB ${rgb.r}, ${rgb.g}, ${rgb.b})`)
        } catch (error) {
          await runLed("BUSY")
          console.log("[v0] LED Mode: Preparation (BUSY fallback)")
        }
        break

      case "cocktailFinished":
      case "finished":
        try {
          const rgb = { r: 0, g: 255, b: 0 } // Green color
          await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
          console.log(`[v0] LED Mode: Finished (GREEN SOLID RGB ${rgb.r}, ${rgb.g}, ${rgb.b})`)
        } catch (error) {
          await runLed("READY")
          console.log("[v0] LED Mode: Finished (READY fallback)")
        }
        break

      case "idle":
        const idleConfig = await loadIdleConfig()
        console.log("[v0] Applying saved idle config:", idleConfig)

        if (idleConfig.scheme === "static" && idleConfig.colors.length > 0) {
          const rgb = hexToRgb(idleConfig.colors[0])
          if (rgb) {
            await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED Mode: Idle (Static RGB ${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        } else if (idleConfig.scheme === "pulse" && idleConfig.colors.length > 0) {
          const rgb = hexToRgb(idleConfig.colors[0])
          if (rgb) {
            await runLed("PULSE", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED Mode: Idle (PULSE RGB ${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        } else if (idleConfig.scheme === "blink" && idleConfig.colors.length > 0) {
          const rgb = hexToRgb(idleConfig.colors[0])
          if (rgb) {
            await runLed("BLINK", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED Mode: Idle (BLINK RGB ${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        } else if (idleConfig.scheme === "off") {
          await runLed("OFF")
          console.log("[v0] LED Mode: Idle (Off)")
        } else {
          const rgb = { r: 255, g: 255, b: 255 }
          await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
          console.log("[v0] LED Mode: Idle (Fallback White)")
        }
        break

      case "off":
        await runLed("OFF")
        console.log("[v0] LED Mode: Off")
        break

      case "color":
        if (color) {
          const rgb = hexToRgb(color)
          if (rgb) {
            await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED color set: RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        }
        break

      default:
        console.warn("[v0] Unknown LED mode:", mode)
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending lighting control command:", error)
    return false
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
