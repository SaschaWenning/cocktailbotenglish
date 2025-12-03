import { type NextRequest, NextResponse } from "next/server"
import { execFile } from "child_process"
import { promisify } from "util"
import path from "path"
import { loadLightingConfig } from "@/lib/lighting-config"

const execFileAsync = promisify(execFile)

async function runLed(...args: string[]): Promise<void> {
  const scriptPath = path.join(process.cwd(), "scripts", "led_client.py")
  const timestamp = new Date().toISOString()
  console.log(`[v0] [${timestamp}] ====== LED COMMAND SENDING ======`)
  console.log(`[v0] [${timestamp}] Script: ${scriptPath}`)
  console.log(`[v0] [${timestamp}] Arguments: [${args.join(", ")}]`)
  console.log(`[v0] [${timestamp}] Full command: python3 ${scriptPath} ${args.join(" ")}`)

  try {
    const result = await execFileAsync("python3", [scriptPath, ...args])
    console.log(`[v0] [${timestamp}] ====== LED COMMAND SUCCESS ======`)
    console.log(`[v0] [${timestamp}] stdout:`, result.stdout)
    console.log(`[v0] [${timestamp}] stderr:`, result.stderr)
  } catch (error) {
    console.error(`[v0] [${timestamp}] ====== LED COMMAND FAILED ======`)
    console.error(`[v0] [${timestamp}] Error:`, error)
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
  const requestTimestamp = new Date().toISOString()

  try {
    const { mode, color, brightness, blinking, scheme } = await request.json()

    console.log(`[v0] [${requestTimestamp}] ========================================`)
    console.log(`[v0] [${requestTimestamp}] LIGHTING CONTROL POST REQUEST RECEIVED`)
    console.log(`[v0] [${requestTimestamp}] ========================================`)
    console.log(`[v0] [${requestTimestamp}] Request body:`, { mode, color, brightness, blinking, scheme })

    if (mode !== "off") {
      console.log(`[v0] [${requestTimestamp}] Sending OFF command to stop any running animation...`)
      await runLed("OFF")
      console.log(`[v0] [${requestTimestamp}] Waiting 100ms after OFF command...`)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log(`[v0] [${requestTimestamp}] Calling sendLightingControlCommand with mode: ${mode}`)
    await sendLightingControlCommand(mode, color, brightness, blinking, scheme)

    if (brightness !== undefined) {
      console.log(`[v0] [${requestTimestamp}] Waiting 50ms before sending brightness...`)
      await new Promise((resolve) => setTimeout(resolve, 50))
      console.log(`[v0] [${requestTimestamp}] Sending BRIGHT command: ${brightness}`)
      await runLed("BRIGHT", String(brightness))
      console.log(`[v0] [${requestTimestamp}] LED Brightness applied after mode: ${brightness}`)
    }

    console.log(`[v0] [${requestTimestamp}] ========================================`)
    console.log(`[v0] [${requestTimestamp}] LIGHTING CONTROL COMPLETE - SUCCESS`)
    console.log(`[v0] [${requestTimestamp}] ========================================`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[v0] [${requestTimestamp}] ========================================`)
    console.error(`[v0] [${requestTimestamp}] LIGHTING CONTROL COMPLETE - ERROR`)
    console.error(`[v0] [${requestTimestamp}] Error:`, error)
    console.error(`[v0] [${requestTimestamp}] ========================================`)
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
    const config = await loadLightingConfig()
    console.log("[v0] Loaded lighting config:", JSON.stringify(config, null, 2))

    switch (mode) {
      case "cocktailPreparation":
      case "preparation":
        const prepColor = color || (config?.preparationMode?.colors && config.preparationMode.colors[0]) || "#ff0000"
        const prepBlinking = blinking !== undefined ? blinking : (config?.preparationMode?.blinking ?? false)

        console.log(`[v0] Preparation mode - Color: ${prepColor}, Blinking: ${prepBlinking}`)

        const prepRgb = hexToRgb(prepColor)
        if (prepRgb) {
          if (prepBlinking) {
            console.log(`[v0] Executing BLINK command with RGB(${prepRgb.r}, ${prepRgb.g}, ${prepRgb.b})`)
            await runLed("BLINK", String(prepRgb.r), String(prepRgb.g), String(prepRgb.b))
            console.log(`[v0] LED Mode: Preparation (BLINK RGB ${prepRgb.r}, ${prepRgb.g}, ${prepRgb.b})`)
          } else {
            console.log(`[v0] Executing COLOR command with RGB(${prepRgb.r}, ${prepRgb.g}, ${prepRgb.b})`)
            await runLed("COLOR", String(prepRgb.r), String(prepRgb.g), String(prepRgb.b))
            console.log(`[v0] LED Mode: Preparation (COLOR RGB ${prepRgb.r}, ${prepRgb.g}, ${prepRgb.b})`)
          }
        }
        break

      case "cocktailFinished":
      case "finished":
        const finColor = color || (config?.finishedMode?.colors && config.finishedMode.colors[0]) || "#00ff00"
        const finBlinking = blinking !== undefined ? blinking : (config?.finishedMode?.blinking ?? false)

        console.log(`[v0] Finished mode - Color: ${finColor}, Blinking: ${finBlinking}`)

        const finRgb = hexToRgb(finColor)
        if (finRgb) {
          if (finBlinking) {
            console.log(`[v0] Executing BLINK command with RGB(${finRgb.r}, ${finRgb.g}, ${finRgb.b})`)
            await runLed("BLINK", String(finRgb.r), String(finRgb.g), String(finRgb.b))
            console.log(`[v0] LED Mode: Finished (BLINK RGB ${finRgb.r}, ${finRgb.g}, ${finRgb.b})`)
          } else {
            console.log(`[v0] Executing COLOR command with RGB(${finRgb.r}, ${finRgb.g}, ${finRgb.b})`)
            await runLed("COLOR", String(finRgb.r), String(finRgb.g), String(finRgb.b))
            console.log(`[v0] LED Mode: Finished (COLOR RGB ${finRgb.r}, ${finRgb.g}, ${finRgb.b})`)
          }
        }
        break

      case "idle":
        const idleScheme = scheme || config?.idleMode?.scheme || "rainbow"
        const idleColor = color || (config?.idleMode?.colors && config.idleMode.colors[0]) || "#00ff00"

        console.log(`[v0] Idle mode - Scheme: ${idleScheme}, Color: ${idleColor}`)

        if (idleScheme === "rainbow") {
          await runLed("RAINBOW")
          console.log("[v0] LED Mode: Idle (Rainbow)")
        } else if (idleScheme === "static") {
          const rgb = hexToRgb(idleColor)
          if (rgb) {
            await runLed("COLOR", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED Mode: Idle (Static RGB ${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        } else if (idleScheme === "pulse") {
          const rgb = hexToRgb(idleColor)
          if (rgb) {
            await runLed("PULSE", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED Mode: Idle (PULSE RGB ${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        } else if (idleScheme === "blink") {
          const rgb = hexToRgb(idleColor)
          if (rgb) {
            await runLed("BLINK", String(rgb.r), String(rgb.g), String(rgb.b))
            console.log(`[v0] LED Mode: Idle (BLINK RGB ${rgb.r}, ${rgb.g}, ${rgb.b})`)
          }
        } else if (idleScheme === "off") {
          await runLed("OFF")
          console.log("[v0] LED Mode: Idle (Off)")
        } else {
          await runLed("RAINBOW")
          console.log("[v0] LED Mode: Idle (Fallback Rainbow)")
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
