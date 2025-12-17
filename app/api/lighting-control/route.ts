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

async function sendLightingControlCommand(
  mode: string,
  color?: string,
  brightness?: number,
  blinking?: boolean,
  scheme?: string,
) {
  try {
    console.log("[v0] sendLightingControlCommand:", { mode, color, brightness, blinking, scheme })

    switch (mode) {
      case "cocktailPreparation":
      case "preparation":
        const prepRgb = color ? hexToRgb(color) : { r: 255, g: 0, b: 0 }
        if (prepRgb && blinking) {
          await runLed("BLINK", String(prepRgb.r), String(prepRgb.g), String(prepRgb.b))
          console.log(`[v0] LED: Preparation BLINK RGB(${prepRgb.r}, ${prepRgb.g}, ${prepRgb.b})`)
        } else if (prepRgb) {
          await runLed("COLOR", String(prepRgb.r), String(prepRgb.g), String(prepRgb.b))
          console.log(`[v0] LED: Preparation COLOR RGB(${prepRgb.r}, ${prepRgb.g}, ${prepRgb.b})`)
        }
        break

      case "cocktailFinished":
      case "finished":
        const finishRgb = color ? hexToRgb(color) : { r: 0, g: 255, b: 0 }
        if (finishRgb && blinking) {
          await runLed("BLINK", String(finishRgb.r), String(finishRgb.g), String(finishRgb.b))
          console.log(`[v0] LED: Finished BLINK RGB(${finishRgb.r}, ${finishRgb.g}, ${finishRgb.b})`)
        } else if (finishRgb) {
          await runLed("COLOR", String(finishRgb.r), String(finishRgb.g), String(finishRgb.b))
          console.log(`[v0] LED: Finished COLOR RGB(${finishRgb.r}, ${finishRgb.g}, ${finishRgb.b})`)
        }
        break

      case "idle":
        if (scheme === "rainbow") {
          await runLed("RAINBOW")
          console.log("[v0] LED: Idle RAINBOW")
        } else if (scheme === "pulse" && color) {
          const rgb = hexToRgb(color)
          if (rgb) {
            await runLed("PULSE", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED: Idle PULSE RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        } else if (scheme === "blink" && color) {
          const rgb = hexToRgb(color)
          if (rgb) {
            await runLed("BLINK", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED: Idle BLINK RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        } else {
          await runLed("RAINBOW")
          console.log("[v0] LED: Idle RAINBOW (fallback)")
        }
        break

      case "color":
        if (color) {
          const rgb = hexToRgb(color)
          if (rgb) {
            await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED: COLOR RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        }
        break

      case "off":
        await runLed("OFF")
        console.log("[v0] LED: OFF")
        break

      default:
        console.warn("[v0] Unknown LED mode:", mode)
    }

    return true
  } catch (error) {
    console.error("[v0] Error sending LED command:", error)
    throw error
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
