"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Wind, Play } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { cleanPump } from "@/lib/cocktail-machine"

interface PumpVentingProps {
  pumpConfig: PumpConfig[]
}

export default function PumpVenting({ pumpConfig }: PumpVentingProps) {
  const [autoVentingStatus, setAutoVentingStatus] = useState<"idle" | "venting">("idle")
  const [currentPump, setCurrentPump] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [pumpsDone, setPumpsDone] = useState<number[]>([])
  const [manualVentingPumps, setManualVentingPumps] = useState<Set<number>>(new Set())

  const enabledPumps = pumpConfig.filter((pump) => pump.enabled)

  // Automatic Venting of all pumps
  const startAutoVenting = async () => {
    setAutoVentingStatus("venting")
    setProgress(0)
    setPumpsDone([])
    setCurrentPump(null)

    // Vent each pump sequentially for 2 seconds
    for (let i = 0; i < enabledPumps.length; i++) {
      const pump = enabledPumps[i]
      setCurrentPump(pump.id)

      try {
        // Run pump for 2 seconds
        await cleanPump(pump.id, 2000)
        setPumpsDone((prev) => [...prev, pump.id])

        // Update progress
        setProgress(Math.round(((i + 1) / enabledPumps.length) * 100))
      } catch (error) {
        console.error(`Error venting pump ${pump.id}:`, error)
      }
    }

    setCurrentPump(null)
    setAutoVentingStatus("idle")
  }

  // Vent single pump (1 second, without loading screen)
  const ventSinglePump = async (pumpId: number) => {
    setManualVentingPumps((prev) => new Set(prev).add(pumpId))

    try {
      await cleanPump(pumpId, 1000) // 1 second
    } catch (error) {
      console.error(`Error venting pump ${pumpId}:`, error)
    } finally {
      // Short delay for visual feedback
      setTimeout(() => {
        setManualVentingPumps((prev) => {
          const newSet = new Set(prev)
          newSet.delete(pumpId)
          return newSet
        })
      }, 100)
    }
  }

  const resetAutoVenting = () => {
    setAutoVentingStatus("idle")
    setCurrentPump(null)
    setProgress(0)
    setPumpsDone([])
  }

  return (
    <div className="space-y-4">
      {/* Automatic Venting */}
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Wind className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Automatic Venting
          </CardTitle>
          <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
            Vent all pumps sequentially for 2 seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
            <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
              <p className="font-medium mb-1">Preparation:</p>
              <p>
                Place a collection container under the outlets and ensure all suction hoses are in their respective
                liquids.
              </p>
            </AlertDescription>
          </Alert>

          {autoVentingStatus === "idle" && (
            <Button
              onClick={startAutoVenting}
              className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black"
              size="lg"
            >
              <Wind className="mr-2 h-5 w-5" />
              Start Automatic Venting
            </Button>
          )}

          {autoVentingStatus === "venting" && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" indicatorClassName="bg-[hsl(var(--cocktail-primary))]" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--cocktail-text-muted))]">
                  {pumpsDone.length} of {enabledPumps.length} pumps vented
                </span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>

              {currentPump !== null && (
                <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--cocktail-primary))]" />
                    <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                      Venting pump {currentPump}...
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="grid grid-cols-5 gap-2">
                {enabledPumps.map((pump) => (
                  <div
                    key={pump.id}
                    className={`p-2 rounded-md text-center ${
                      pumpsDone.includes(pump.id)
                        ? "bg-[hsl(var(--cocktail-success))]/10 border border-[hsl(var(--cocktail-success))]/30"
                        : currentPump === pump.id
                          ? "bg-[hsl(var(--cocktail-primary))]/20 border border-[hsl(var(--cocktail-primary))]/50 font-bold animate-pulse"
                          : "bg-[hsl(var(--cocktail-bg))] border border-[hsl(var(--cocktail-card-border)))"
                    }`}
                  >
                    <span className={`text-sm ${currentPump === pump.id ? "text-white font-bold" : ""}`}>
                      {pump.id}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={resetAutoVenting}
                className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border)))]"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Single Pump Venting */}
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Play className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Manual Venting
          </CardTitle>
          <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
            Vent individual pumps for 1 second
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
            <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
              Click on a pump to vent it for 1 second. The pump starts immediately without a loading screen.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-5 gap-3">
            {enabledPumps.map((pump) => (
              <div key={pump.id} className="flex flex-col items-center space-y-2">
                <Button
                  onClick={() => ventSinglePump(pump.id)}
                  disabled={autoVentingStatus === "venting"}
                  className={`w-full h-12 ${
                    manualVentingPumps.has(pump.id)
                      ? "bg-[hsl(var(--cocktail-primary))]/30 border border-[hsl(var(--cocktail-primary))]/50"
                      : "bg-[hsl(var(--cocktail-card-bg))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black"
                  } text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]`}
                >
                  {manualVentingPumps.has(pump.id) ? (
                    <Wind className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Wind className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-xs text-[hsl(var(--cocktail-text-muted))] text-center">
                  Pump {pump.id}
                  {pump.ingredient && <div className="text-[10px] opacity-70">{pump.ingredient}</div>}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
