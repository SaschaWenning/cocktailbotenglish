"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, Sun, Play, Loader2, RotateCcw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type IdleScheme = "rainbow" | "pulse" | "blink" | "static" | "off"

interface LightingSettings {
  idleScheme: IdleScheme
  idleColor: string
  brightness: number
}

const defaultSettings: LightingSettings = {
  idleScheme: "rainbow",
  idleColor: "#ffffff",
  brightness: 128,
}

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

const idleSchemes: Array<{ name: string; value: IdleScheme; icon: string }> = [
  { name: "Rainbow", value: "rainbow", icon: "🌈" },
  { name: "Pulse", value: "pulse", icon: "✨" },
  { name: "Blink", value: "blink", icon: "⚡" },
  { name: "Static", value: "static", icon: "⚪" },
  { name: "Off", value: "off", icon: "⚫" },
]

export default function LightingControl() {
  const [settings, setSettings] = useState<LightingSettings>(defaultSettings)
  const [tempBrightness, setTempBrightness] = useState(128)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem("led-settings")
      if (saved) {
        const loaded = JSON.parse(saved)
        setSettings(loaded)
        setTempBrightness(loaded.brightness)
        console.log("[v0] LightingControl: Loaded LED settings:", loaded)
      } else {
        setSettings(defaultSettings)
        setTempBrightness(defaultSettings.brightness)
        console.log("[v0] LightingControl: Using default LED settings")
      }
    } catch (error) {
      console.error("[v0] LightingControl: Error loading LED settings:", error)
      setSettings(defaultSettings)
      setTempBrightness(defaultSettings.brightness)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = (newSettings: LightingSettings) => {
    try {
      localStorage.setItem("led-settings", JSON.stringify(newSettings))
      setSettings(newSettings)
      console.log("[v0] LightingControl: Saved LED settings:", newSettings)
    } catch (error) {
      console.error("[v0] LightingControl: Error saving LED settings:", error)
    }
  }

  const applyBrightness = async () => {
    setApplying("brightness")
    try {
      console.log(`[v0] LightingControl: Applying brightness ${tempBrightness}`)

      const response = await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "brightness",
          brightness: tempBrightness,
        }),
      })

      console.log(`[v0] LightingControl: Brightness response status: ${response.status}`)

      if (!response.ok) {
        throw new Error(`Failed to set brightness: ${response.status}`)
      }

      const newSettings = { ...settings, brightness: tempBrightness }
      saveSettings(newSettings)

      toast({
        title: "Brightness Applied",
        description: `Set to ${Math.round((tempBrightness / 255) * 100)}%`,
      })

      console.log("[v0] LightingControl: Brightness applied successfully")
    } catch (error) {
      console.error("[v0] LightingControl: Error setting brightness:", error)
      toast({
        title: "Error",
        description: "Failed to set brightness",
        variant: "destructive",
      })
    } finally {
      setApplying(null)
    }
  }

  const saveAndApplyIdle = async () => {
    setApplying("idle")
    try {
      console.log("[v0] LightingControl: Saving and applying idle mode:", settings.idleScheme)

      // Save settings first
      saveSettings(settings)

      let body: any = {}

      if (settings.idleScheme === "static") {
        body = { mode: "color", color: settings.idleColor }
      } else if (settings.idleScheme === "off") {
        body = { mode: "off" }
      } else if (settings.idleScheme === "pulse") {
        body = { mode: "idle", scheme: "pulse", color: settings.idleColor }
      } else if (settings.idleScheme === "blink") {
        body = { mode: "idle", scheme: "blink", color: settings.idleColor }
      } else {
        body = { mode: "idle", scheme: "rainbow" }
      }

      console.log("[v0] LightingControl: Sending request body:", body)

      const response = await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      console.log(`[v0] LightingControl: Idle mode response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] LightingControl: Error response:", errorText)
        throw new Error(`Failed to apply idle mode: ${response.status}`)
      }

      toast({
        title: "Idle Mode Applied",
        description: `${settings.idleScheme} mode activated`,
      })

      console.log("[v0] LightingControl: Idle mode applied successfully")
    } catch (error) {
      console.error("[v0] LightingControl: Error applying idle mode:", error)
      toast({
        title: "Error",
        description: "Failed to apply idle mode",
        variant: "destructive",
      })
    } finally {
      setApplying(null)
    }
  }

  const resetToDefault = () => {
    setSettings(defaultSettings)
    setTempBrightness(defaultSettings.brightness)
    saveSettings(defaultSettings)
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
    <div className="space-y-6 bg-[hsl(var(--cocktail-bg))] min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[hsl(var(--cocktail-primary))]/10 border border-[hsl(var(--cocktail-primary))]/20">
              <Lightbulb className="h-7 w-7 text-[hsl(var(--cocktail-primary))]" />
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-[hsl(var(--cocktail-text))]">LED Lighting</h2>
              <p className="text-sm text-[hsl(var(--cocktail-text-muted))]">Control RGB lighting</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={resetToDefault}
          className="bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-12 px-6"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Reset to Default
        </Button>
      </div>

      {/* Brightness Control */}
      <Card className="bg-gradient-to-br from-[hsl(var(--cocktail-card-bg))] to-[hsl(var(--cocktail-card-bg))]/80 border-[hsl(var(--cocktail-card-border))]/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg text-[hsl(var(--cocktail-text))]">
            <div className="p-2 rounded-lg bg-[hsl(var(--cocktail-primary))]/10">
              <Sun className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            </div>
            Global Brightness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-[hsl(var(--cocktail-text))] w-16">
                {Math.round((tempBrightness / 255) * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="255"
                value={tempBrightness}
                onChange={(e) => setTempBrightness(Number.parseInt(e.target.value))}
                className="flex-1 h-3 bg-[hsl(var(--cocktail-card-bg))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--cocktail-primary))]"
              />
              <span className="text-sm text-[hsl(var(--cocktail-text-muted))] w-16 text-right">
                {tempBrightness}/255
              </span>
            </div>
            <Button
              onClick={applyBrightness}
              disabled={applying !== null || tempBrightness === settings.brightness}
              className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-12 text-base disabled:opacity-50"
            >
              {applying === "brightness" ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Apply Brightness
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Idle Settings */}
      <Card className="bg-gradient-to-br from-[hsl(var(--cocktail-card-bg))] to-[hsl(var(--cocktail-card-bg))]/80 border-[hsl(var(--cocktail-card-border))]/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-[hsl(var(--cocktail-text))]">💤 Idle Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Scheme</label>
            <div className="grid grid-cols-2 gap-2">
              {idleSchemes.map((scheme) => (
                <Button
                  key={scheme.value}
                  variant={settings.idleScheme === scheme.value ? "default" : "outline"}
                  onClick={() => {
                    const newSettings = { ...settings, idleScheme: scheme.value }
                    setSettings(newSettings)
                  }}
                  className={
                    settings.idleScheme === scheme.value
                      ? "bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-12"
                      : "bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] h-12"
                  }
                >
                  <span className="mr-2">{scheme.icon}</span>
                  {scheme.name}
                </Button>
              ))}
            </div>
          </div>

          {(settings.idleScheme === "static" || settings.idleScheme === "pulse" || settings.idleScheme === "blink") && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Color</label>
              <div className="grid grid-cols-7 gap-1.5">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      const newSettings = { ...settings, idleColor: preset.value }
                      setSettings(newSettings)
                      console.log("[v0] LightingControl: Color changed to:", preset.value)
                    }}
                    className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                      settings.idleColor === preset.value
                        ? "border-[hsl(var(--cocktail-primary))] scale-110 shadow-lg"
                        : "border-[hsl(var(--cocktail-card-border))]"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
              <input
                type="color"
                value={settings.idleColor}
                onChange={(e) => {
                  const newSettings = { ...settings, idleColor: e.target.value }
                  setSettings(newSettings)
                  console.log("[v0] LightingControl: Custom color selected:", e.target.value)
                }}
                className="w-full h-10 rounded-lg border-2 border-[hsl(var(--cocktail-card-border))] cursor-pointer"
              />
            </div>
          )}

          <Button
            onClick={saveAndApplyIdle}
            disabled={applying !== null}
            className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base disabled:opacity-50"
          >
            {applying === "idle" ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Apply Idle Mode
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
