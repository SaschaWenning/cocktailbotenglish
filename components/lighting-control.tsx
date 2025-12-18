"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Play, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type LightingConfig, defaultConfig } from "@/lib/lighting-config-types"

const colorPresets = [
  { name: "Red", value: "#ff0000" },
  { name: "Green", value: "#00ff00" },
  { name: "Blue", value: "#0000ff" },
  { name: "Yellow", value: "#ffff00" },
  { name: "Magenta", value: "#ff00ff" },
  { name: "Cyan", value: "#00ffff" },
  { name: "White", value: "#ffffff" },
  { name: "Orange", value: "#ff8000" },
  { name: "Purple", value: "#8000ff" },
  { name: "Pink", value: "#ff0080" },
]

const idleSchemes = [
  { name: "Pulse", value: "pulse", icon: "✨" },
  { name: "Blink", value: "blink", icon: "⚡" },
  { name: "Static", value: "static", icon: "⚪" },
  { name: "Off", value: "off", icon: "⚫" },
]

export default function LightingControl() {
  const [config, setConfig] = useState<LightingConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [brightness, setBrightness] = useState(128) // 0-255, default 50%
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
    loadBrightness()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/lighting-config")
      if (response.ok) {
        const loadedConfig = await response.json()
        setConfig(loadedConfig)
      } else {
        setConfig(defaultConfig)
      }
    } catch (error) {
      console.error("[v0] Error loading lighting config:", error)
      setConfig(defaultConfig)
    } finally {
      setLoading(false)
    }
  }

  const loadBrightness = () => {
    try {
      const saved = localStorage.getItem("led-brightness")
      if (saved) {
        const value = Number.parseInt(saved)
        setBrightness(value)
      }
    } catch (error) {
      console.error("[v0] Error loading brightness:", error)
    }
  }

  const applyLighting = async (mode: "idle" | "off", isTest = false) => {
    setApplying(mode)
    try {
      console.log("[v0] Applying lighting mode:", mode, "Config:", JSON.stringify(config.idleMode))

      console.log("[v0] Saving config before applying...")
      const saveResponse = await fetch("/api/lighting-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save configuration")
      }
      console.log("[v0] Config saved successfully")

      const body = { mode: "idle" }

      console.log("[v0] Sending lighting control request:", body)
      const response = await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to apply lighting")
      }

      toast({
        title: "Lighting Applied",
        description: `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode activated.`,
      })

      console.log("[v0] Lighting applied successfully:", mode)
    } catch (error) {
      console.error("[v0] Error applying lighting:", error)
      toast({
        title: "Error",
        description: "Lighting could not be applied",
        variant: "destructive",
      })
    } finally {
      setApplying(null)
    }
  }

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value)
    localStorage.setItem("led-brightness", value.toString())

    try {
      const response = await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "brightness",
          brightness: value,
        }),
      })

      if (!response.ok) {
        console.error("[v0] Failed to set brightness:", response.status)
      } else {
        console.log("[v0] Brightness set to:", value)
      }
    } catch (error) {
      console.error("[v0] Error setting brightness:", error)
    }
  }

  const resetToDefault = () => {
    setConfig(defaultConfig)
  }

  const updateConfig = (path: string, value: any) => {
    setConfig((prev) => {
      const newConfig = JSON.parse(JSON.stringify(prev))
      const keys = path.split(".")
      let current = newConfig

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value

      return newConfig
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 bg-[hsl(var(--cocktail-bg))] min-h-[400px]">
        <div className="text-center space-y-4">
          <Lightbulb className="h-16 w-16 mx-auto animate-pulse text-[hsl(var(--cocktail-primary))]" />
          <h3 className="text-xl font-semibold text-[hsl(var(--cocktail-text))]">Loading lighting settings</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] shadow-lg">
        <CardHeader className="border-b border-[hsl(var(--cocktail-card-border))]">
          <CardTitle className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">Global Brightness</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-[hsl(var(--cocktail-text))] w-16">
                {Math.round((brightness / 255) * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="255"
                value={brightness}
                onChange={(e) => handleBrightnessChange(Number.parseInt(e.target.value))}
                className="flex-1 h-4 bg-gradient-to-r from-gray-800 via-yellow-400 to-white rounded-lg appearance-none cursor-pointer shadow-md 
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-yellow-300 [&::-webkit-slider-thumb]:to-yellow-500 
                  [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                  [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-yellow-300 [&::-moz-range-thumb]:to-yellow-500 
                  [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
                  [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:transition-transform"
              />
              <span className="text-sm text-[hsl(var(--cocktail-text-muted))] w-16 text-right">{brightness}/255</span>
            </div>
            <p className="text-xs text-[hsl(var(--cocktail-text-muted))]">
              Controls the brightness of all LED modes (0-255). Changes apply immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))] shadow-lg">
        <CardHeader className="border-b border-[hsl(var(--cocktail-card-border))]">
          <CardTitle className="text-2xl font-bold text-[hsl(var(--cocktail-text))] flex items-center gap-3">
            Idle Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Color Scheme</label>
            <div className="flex flex-wrap gap-2">
              {idleSchemes.map((scheme) => (
                <button
                  key={scheme.value}
                  onClick={() => updateConfig("idleMode.scheme", scheme.value)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    config.idleMode.scheme === scheme.value
                      ? "bg-[hsl(var(--cocktail-primary))] text-black"
                      : "bg-[hsl(var(--cocktail-button-bg))] text-[hsl(var(--cocktail-text))] border border-[hsl(var(--cocktail-card-border))]"
                  }`}
                >
                  <span className="mr-1">{scheme.icon}</span>
                  {scheme.name}
                </button>
              ))}
            </div>
          </div>
          {(config.idleMode.scheme === "static" ||
            config.idleMode.scheme === "pulse" ||
            config.idleMode.scheme === "blink") && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">
                {config.idleMode.scheme === "static"
                  ? "Static Color"
                  : config.idleMode.scheme === "pulse"
                    ? "Pulse Color"
                    : "Blink Color"}
              </label>
              <div className="grid grid-cols-10 gap-1">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("idleMode.colors", [preset.value])}
                    className={`w-full aspect-square rounded-md border transition-all hover:scale-125 ${
                      config.idleMode.colors[0] === preset.value
                        ? "border-[hsl(var(--cocktail-primary))] scale-110 shadow-lg border-2"
                        : "border-[hsl(var(--cocktail-card-border))] border-1"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
              <input
                type="color"
                value={config.idleMode.colors[0] || "#ffffff"}
                onChange={(e) => updateConfig("idleMode.colors", [e.target.value])}
                className="w-16 h-5 rounded-md border border-[hsl(var(--cocktail-card-border))] cursor-pointer"
              />
            </div>
          )}
          <div className="pt-2">
            <Button
              onClick={() => applyLighting("idle", false)}
              disabled={applying !== null}
              className="px-3 py-1 bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold text-xs disabled:opacity-50"
            >
              {applying === "idle" ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Apply
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
