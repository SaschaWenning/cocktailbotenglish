"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Loader2, Sparkles, Sun } from "lucide-react"
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
  const [brightness, setBrightness] = useState(128) // 0-255, default 50%
  const [lastIdleConfig, setLastIdleConfig] = useState<string | null>(null)
  const [config, setConfig] = useState<LightingConfig>({
    cocktailPreparation: { color: "#ffff00", blinking: false },
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
        setLastIdleConfig(JSON.stringify(loadedConfig.idleMode))
      } else {
        setConfig({
          cocktailPreparation: { color: "#ffff00", blinking: false },
          cocktailFinished: { color: "#00ff00", blinking: false },
          idleMode: { scheme: "rainbow", colors: [] },
        })
      }
    } catch (error) {
      console.error("[v0] Error loading lighting config:", error)
      setConfig({
        cocktailPreparation: { color: "#ffff00", blinking: false },
        cocktailFinished: { color: "#00ff00", blinking: false },
        idleMode: { scheme: "rainbow", colors: [] },
      })
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

  const applyLighting = async (mode: "preparation" | "finished" | "idle" | "off", isTest = false) => {
    setApplying(mode)

    try {
      const lightingPayload: {
        mode: string
        color?: string
        blinking?: boolean
        brightness: number
        scheme?: string
      } = {
        mode,
        brightness: brightness,
      }

      if (mode === "preparation") {
        lightingPayload.color = config.cocktailPreparation.color
        lightingPayload.blinking = config.cocktailPreparation.blinking
      } else if (mode === "finished") {
        lightingPayload.color = config.cocktailFinished.color
        lightingPayload.blinking = config.cocktailFinished.blinking
      } else if (mode === "idle") {
        lightingPayload.scheme = config.idleMode.scheme
        if (
          config.idleMode.scheme === "pulse" ||
          config.idleMode.scheme === "blink" ||
          config.idleMode.scheme === "static"
        ) {
          if (config.idleMode.colors.length > 0) {
            lightingPayload.color = config.idleMode.colors[0]
          }
        }
        setLastIdleConfig(JSON.stringify(config.idleMode))
      }

      const response = await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lightingPayload),
      })

      if (!response.ok) {
        throw new Error(`Failed to set lighting mode: ${mode}`)
      }

      console.log(`[v0] Lighting mode set to: ${mode}`)

      toast({
        title: "Success",
        description: `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode ${isTest ? "preview" : "applied"}`,
      })

      if (isTest && lastIdleConfig) {
        setTimeout(async () => {
          try {
            const idleConfig = JSON.parse(lastIdleConfig)
            const idlePayload: {
              mode: string
              brightness: number
              scheme?: string
              color?: string
            } = {
              mode: "idle",
              brightness: brightness,
              scheme: idleConfig.scheme,
            }

            if (idleConfig.scheme === "pulse" || idleConfig.scheme === "blink" || idleConfig.scheme === "static") {
              if (idleConfig.colors && idleConfig.colors.length > 0) {
                idlePayload.color = idleConfig.colors[0]
              }
            }

            await fetch("/api/lighting-control", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(idlePayload),
            })

            console.log("[v0] Returned to idle mode after test")
            setApplying(null)
          } catch (error) {
            console.error("[v0] Error returning to idle mode:", error)
            setApplying(null)
          }
        }, 3000)
      } else {
        setApplying(null)
      }
    } catch (error) {
      console.error(`[v0] Error applying lighting mode ${mode}:`, error)
      setApplying(null)
      toast({
        title: "Error",
        description: `Failed to apply ${mode} mode`,
        variant: "destructive",
      })
    }
  }

  const applyBrightness = async (value: number) => {
    try {
      setBrightness(value)
      localStorage.setItem("led-brightness", value.toString())

      const idlePayload: {
        mode: string
        brightness: number
        scheme?: string
        color?: string
      } = {
        mode: "idle",
        brightness: value,
        scheme: config.idleMode.scheme,
      }

      if (
        config.idleMode.scheme === "pulse" ||
        config.idleMode.scheme === "blink" ||
        config.idleMode.scheme === "static"
      ) {
        if (config.idleMode.colors.length > 0) {
          idlePayload.color = config.idleMode.colors[0]
        }
      }

      const response = await fetch("/api/lighting-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(idlePayload),
      })

      if (!response.ok) {
        throw new Error("Failed to set brightness")
      }

      console.log("[v0] Brightness applied with idle mode:", value)
    } catch (error) {
      console.error("[v0] Error setting brightness:", error)
      toast({
        title: "Error",
        description: "Brightness could not be applied",
        variant: "destructive",
      })
    }
  }

  const saveConfig = async () => {
    try {
      const response = await fetch("/api/lighting-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error("Failed to save configuration")
      }

      toast({
        title: "Success",
        description: "Lighting configuration saved",
      })
    } catch (error) {
      console.error("[v0] Error saving config:", error)
      toast({
        title: "Error",
        description: "Configuration could not be saved",
        variant: "destructive",
      })
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
              <Sun className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
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
                onChange={(e) => applyBrightness(Number.parseInt(e.target.value))}
                className="flex-1 h-3 bg-[hsl(var(--cocktail-card-bg))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--cocktail-primary))]"
              />
              <span className="text-sm text-[hsl(var(--cocktail-text-muted))] w-16 text-right">{brightness}/255</span>
            </div>
            <p className="text-xs text-[hsl(var(--cocktail-text-muted))]">
              Controls the brightness of all LED modes (0-255). Changes apply immediately and are used when activating
              idle mode.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cocktail Preparation */}
      <Card className="border-2 border-[hsl(var(--cocktail-card-border))] bg-[hsl(var(--cocktail-card-bg))] shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[hsl(var(--cocktail-text))]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--cocktail-primary))]">
              <Sparkles className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            </div>
            Cocktail Preparation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Color during preparation</label>
            <div className="grid grid-cols-5 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => updateConfig("cocktailPreparation.color", preset.value)}
                  className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
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
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                saveConfig()
              }}
              className="flex-1 bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] font-semibold h-14 text-base border-2 border-[hsl(var(--cocktail-card-border))]"
            >
              Save
            </Button>
            <Button
              onClick={() => applyLighting("preparation", true)}
              disabled={applying !== null}
              className="flex-1 bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base px-4 disabled:opacity-50"
            >
              {applying === "preparation" ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Test (3s)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cocktail Finished */}
      <Card className="border-2 border-[hsl(var(--cocktail-card-border))] bg-[hsl(var(--cocktail-card-bg))] shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[hsl(var(--cocktail-text))]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--cocktail-primary))]">
              <Sparkles className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            </div>
            Cocktail Finished
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">Color when finished</label>
            <div className="grid grid-cols-5 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => updateConfig("cocktailFinished.color", preset.value)}
                  className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
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
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => {
                saveConfig()
              }}
              className="flex-1 bg-[hsl(var(--cocktail-button-bg))] hover:bg-[hsl(var(--cocktail-button-hover))] text-[hsl(var(--cocktail-text))] font-semibold h-14 text-base border-2 border-[hsl(var(--cocktail-card-border))]"
            >
              Save
            </Button>
            <Button
              onClick={() => applyLighting("finished", true)}
              disabled={applying !== null}
              className="flex-1 bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base px-4 disabled:opacity-50"
            >
              {applying === "finished" ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Test (3s)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Idle Mode */}
      <Card className="border-2 border-[hsl(var(--cocktail-card-border))] bg-[hsl(var(--cocktail-card-bg))] shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-[hsl(var(--cocktail-text))]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--cocktail-primary))]">
              <Sparkles className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
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
              <label className="text-sm font-semibold text-[hsl(var(--cocktail-text))]">
                {config.idleMode.scheme === "static"
                  ? "Static color"
                  : config.idleMode.scheme === "pulse"
                    ? "Pulse color"
                    : "Blink color"}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateConfig("idleMode.colors", [preset.value])}
                    className={`w-full aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
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
          <div className="pt-2">
            <Button
              onClick={() => applyLighting("idle", false)}
              disabled={applying !== null}
              className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold h-14 text-base px-4 disabled:opacity-50"
            >
              {applying === "idle" ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate Idle Mode"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
