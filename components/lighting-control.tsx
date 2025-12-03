"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, Sun } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type LightingConfig = {
  cocktailPreparation: {
    color: string
    blinking: boolean
  }
  cocktailFinished: {
    color: string
    blinking: boolean
  }
  idleMode: {
    scheme: "rainbow" | "pulse" | "blink" | "static" | "off"
    colors: string[]
  }
}

const idleSchemes = [
  { name: "Rainbow", value: "rainbow", icon: "🌈" },
  { name: "Pulse", value: "pulse", icon: "✨" },
  { name: "Blink", value: "blink", icon: "⚡" },
  { name: "Static", value: "static", icon: "⚪" },
  { name: "Off", value: "off", icon: "⚫" },
]

export default function LightingControl() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)
  const [brightness, setBrightness] = useState(128)
  const [config, setConfig] = useState<LightingConfig>({
    cocktailPreparation: { color: "#ff0000", blinking: true },
    cocktailFinished: { color: "#00ff00", blinking: false },
    idleMode: { scheme: "rainbow", colors: [] },
  })

  const colorPresets = [
    { name: "Red", value: "#ff0000" },
    { name: "Green", value: "#00ff00" },
    { name: "Blue", value: "#0000ff" },
    { name: "Yellow", value: "#ffff00" },
    { name: "Purple", value: "#ff00ff" },
    { name: "Cyan", value: "#00ffff" },
    { name: "Orange", value: "#ff8800" },
    { name: "Pink", value: "#ff0088" },
    { name: "White", value: "#ffffff" },
    { name: "Warm White", value: "#ffddaa" },
  ]

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
      }
    } catch (error) {
      console.error("Error loading lighting config:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadBrightness = () => {
    try {
      const saved = localStorage.getItem("led-brightness")
      if (saved) {
        setBrightness(Number.parseInt(saved))
      }
    } catch (error) {
      console.error("Error loading brightness:", error)
    }
  }

  const applyLighting = async (mode: "preparation" | "finished" | "idle") => {
    setApplying(mode)

    try {
      // Save config first
      await fetch("/api/lighting-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      // Build payload
      const payload: any = { mode, brightness }

      if (mode === "preparation") {
        payload.color = config.cocktailPreparation.color
        payload.blinking = config.cocktailPreparation.blinking
      } else if (mode === "finished") {
        payload.color = config.cocktailFinished.color
        payload.blinking = config.cocktailFinished.blinking
      } else if (mode === "idle") {
        payload.scheme = config.idleMode.scheme
        if (config.idleMode.colors.length > 0) {
          payload.color = config.idleMode.colors[0]
        }
      }

      // Apply lighting
      await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast({
        title: "Success",
        description: `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode applied`,
      })

      // If preparation or finished, wait 3 seconds then return to idle
      if (mode === "preparation" || mode === "finished") {
        setTimeout(async () => {
          try {
            const idlePayload: any = {
              mode: "idle",
              brightness,
              scheme: config.idleMode.scheme,
            }
            if (config.idleMode.colors.length > 0) {
              idlePayload.color = config.idleMode.colors[0]
            }

            await fetch("/api/lighting-control", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(idlePayload),
            })

            setApplying(null)
          } catch (error) {
            console.error("Error returning to idle:", error)
            setApplying(null)
          }
        }, 3000)
      } else {
        setApplying(null)
      }
    } catch (error) {
      console.error(`Error applying ${mode}:`, error)
      setApplying(null)
      toast({
        title: "Error",
        description: `Failed to apply ${mode} mode`,
        variant: "destructive",
      })
    }
  }

  const handleBrightnessChange = async (value: number) => {
    setBrightness(value)
    localStorage.setItem("led-brightness", value.toString())

    try {
      const payload: any = {
        mode: "idle",
        brightness: value,
        scheme: config.idleMode.scheme,
      }
      if (config.idleMode.colors.length > 0) {
        payload.color = config.idleMode.colors[0]
      }

      await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error("Error setting brightness:", error)
    }
  }

  const updateConfig = (path: string, value: any) => {
    setConfig((prev) => {
      const newConfig = { ...prev }
      const keys = path.split(".")
      let current: any = newConfig

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newConfig
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--cocktail-primary))]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Brightness Control */}
      <Card className="border-2 border-[hsl(var(--cocktail-card-border))] bg-[hsl(var(--cocktail-card-bg))] shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[hsl(var(--cocktail-text))]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--cocktail-primary))]">
              <Sun className="h-5 w-5 text-black" />
            </div>
            Global Brightness
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                className="flex-1 h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[hsl(var(--cocktail-primary))]"
              />
              <span className="text-sm text-[hsl(var(--cocktail-text-muted))] w-16 text-right">{brightness}/255</span>
            </div>
            <p className="text-xs text-[hsl(var(--cocktail-text-muted))]">
              Controls the brightness of all LED modes. Changes apply immediately.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cocktail Preparation */}
      <Card className="border-2 border-[hsl(var(--cocktail-card-border))] bg-[hsl(var(--cocktail-card-bg))] shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[hsl(var(--cocktail-text))]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--cocktail-primary))]">
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            Cocktail Preparation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Color during preparation</label>
            <div className="grid grid-cols-10 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => updateConfig("cocktailPreparation.color", preset.value)}
                  className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                    config.cocktailPreparation.color === preset.value
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
              value={config.cocktailPreparation.color}
              onChange={(e) => updateConfig("cocktailPreparation.color", e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-[hsl(var(--cocktail-card-border))] cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-[hsl(var(--cocktail-bg))] rounded-xl border border-[hsl(var(--cocktail-card-border))]">
            <input
              type="checkbox"
              id="prep-blink"
              checked={config.cocktailPreparation.blinking}
              onChange={(e) => updateConfig("cocktailPreparation.blinking", e.target.checked)}
              className="w-5 h-5 rounded accent-[hsl(var(--cocktail-primary))] cursor-pointer"
            />
            <label
              htmlFor="prep-blink"
              className="text-sm font-semibold text-[hsl(var(--cocktail-text))] cursor-pointer"
            >
              Blinking effect
            </label>
          </div>
          <Button
            onClick={() => applyLighting("preparation")}
            disabled={applying !== null}
            className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base disabled:opacity-50"
          >
            {applying === "preparation" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Testing (3s)...
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Cocktail Finished */}
      <Card className="border-2 border-[hsl(var(--cocktail-card-border))] bg-[hsl(var(--cocktail-card-bg))] shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[hsl(var(--cocktail-text))]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--cocktail-primary))]">
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            Cocktail Finished
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Color when finished</label>
            <div className="grid grid-cols-10 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => updateConfig("cocktailFinished.color", preset.value)}
                  className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                    config.cocktailFinished.color === preset.value
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
              value={config.cocktailFinished.color}
              onChange={(e) => updateConfig("cocktailFinished.color", e.target.value)}
              className="w-full h-12 rounded-xl border-2 border-[hsl(var(--cocktail-card-border))] cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-[hsl(var(--cocktail-bg))] rounded-xl border border-[hsl(var(--cocktail-card-border))]">
            <input
              type="checkbox"
              id="finished-blink"
              checked={config.cocktailFinished.blinking}
              onChange={(e) => updateConfig("cocktailFinished.blinking", e.target.checked)}
              className="w-5 h-5 rounded accent-[hsl(var(--cocktail-primary))] cursor-pointer"
            />
            <label
              htmlFor="finished-blink"
              className="text-sm font-semibold text-[hsl(var(--cocktail-text))] cursor-pointer"
            >
              Blinking effect
            </label>
          </div>
          <Button
            onClick={() => applyLighting("finished")}
            disabled={applying !== null}
            className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base disabled:opacity-50"
          >
            {applying === "finished" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Testing (3s)...
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Idle Mode */}
      <Card className="border-2 border-[hsl(var(--cocktail-card-border))] bg-[hsl(var(--cocktail-card-bg))] shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[hsl(var(--cocktail-text))]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--cocktail-primary))]">
              <Sparkles className="h-5 w-5 text-black" />
            </div>
            Idle Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Color scheme</label>
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
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Color</label>
              <div className="grid grid-cols-10 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("idleMode.colors", [preset.value])}
                    className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                      config.idleMode.colors[0] === preset.value
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
                value={config.idleMode.colors[0] || "#ffffff"}
                onChange={(e) => updateConfig("idleMode.colors", [e.target.value])}
                className="w-full h-12 rounded-xl border-2 border-[hsl(var(--cocktail-card-border))] cursor-pointer"
              />
            </div>
          )}
          <Button
            onClick={() => applyLighting("idle")}
            disabled={applying !== null}
            className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base disabled:opacity-50"
          >
            {applying === "idle" ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
