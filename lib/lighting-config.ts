import { type LightingConfig, defaultConfig } from "./lighting-config-types"
import fs from "fs/promises"
import path from "path"

export type { LightingConfig }
export { defaultConfig }

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "lighting-config.json")

export async function loadLightingConfig(): Promise<LightingConfig> {
  try {
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, "utf-8")
    const config = JSON.parse(fileContent)
    console.log("[v0] Lighting config loaded from file:", JSON.stringify(config, null, 2))
    return config
  } catch (error) {
    console.log("[v0] No lighting config file found, using default config")
  }
  return defaultConfig
}

export async function saveLightingConfig(config: LightingConfig): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), "data")
    try {
      await fs.access(dataDir)
    } catch {
      await fs.mkdir(dataDir, { recursive: true })
    }

    await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8")
    console.log("[v0] Lighting config saved to file successfully")
  } catch (error) {
    console.error("[v0] Error saving lighting config:", error)
    throw error
  }
}

export async function hexToRgb(hex: string): Promise<{ r: number; g: number; b: number } | null> {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}
