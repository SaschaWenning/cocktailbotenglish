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
      console.log("[v0] Applying lighting mode:", mode, "isTest:", isTest)

      console.log("[v0] Saving config before applying:", config)
      const saveResponse = await fetch("/api/lighting-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save configuration")
      }
      console.log("[v0] Config saved successfully")

      let body: any = {}

      if (mode === "idle") {
        if (config.idleMode.scheme === "static" && config.idleMode.colors.length > 0) {
          body = { mode: "color", color: config.idleMode.colors[0] }
        } else if (config.idleMode.scheme === "off") {
          body = { mode: "off" }
        } else if (config.idleMode.scheme === "pulse" || config.idleMode.scheme === "blink") {
          body = {
            mode: "idle",
            scheme: config.idleMode.scheme,
            color: config.idleMode.colors.length > 0 ? config.idleMode.colors[0] : "#ffffff",
          }
        } else {
          body = { mode: "idle", scheme: config.idleMode.scheme }
        }
      } else if (mode === "off") {
        body = { mode: "off" }
      }

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
        throw new Error("Failed to set brightness")
      }

      console.log("[v0] Brightness set to:", value)
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
                className="flex-1 h-3 bg-gradient-to-r from-gray-800 via-yellow-400 to-white rounded-lg appearance-none cursor-pointer accent-yellow-500 shadow-md"
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
            <div className="grid grid-cols-1 gap-2">
              {idleSchemes.map((scheme) => (
                <Button
                  key={scheme.value}
                  variant={config.idleMode.scheme === scheme.value ? "default" : "outline"}
                  onClick={() => updateConfig("idleMode.scheme", scheme.value)}
                  className={
                    config.idleMode.scheme === scheme.value
                      ? "bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-12 justify-start"
                      : "bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-12 justify-start"
                  }
                >
                  <span className="text-xl mr-3">{scheme.icon}</span>
                  {scheme.name}
                </Button>
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
              <div className="grid grid-cols-6 gap-0.5">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("idleMode.colors", [preset.value])}
                    className={`w-full aspect-square rounded-md border transition-all hover:scale-110 ${
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
                className="w-20 h-6 rounded-md border border-[hsl(var(--cocktail-card-border))] cursor-pointer"
              />
            </div>
          )}
          <div className="pt-2">
            <Button
              onClick={() => applyLighting("idle", false)}
              disabled={applying !== null}
              className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base px-4 disabled:opacity-50"
            >
              {applying === "idle" ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
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
