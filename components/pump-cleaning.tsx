"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Droplets, Check, AlertTriangle, Settings } from "lucide-react"
import type { PumpConfig } from "@/types/pump"
import { cleanPump } from "@/lib/cocktail-machine"

interface PumpCleaningProps {
  pumpConfig: PumpConfig[]
}

export default function PumpCleaning({ pumpConfig }: PumpCleaningProps) {
  const [cleaningStatus, setCleaningStatus] = useState<"idle" | "preparing" | "cleaning" | "complete">("idle")
  const [currentPump, setCurrentPump] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [pumpsDone, setPumpsDone] = useState<number[]>([])
  const [manualCleaningPumps, setManualCleaningPumps] = useState<Set<number>>(new Set())
  const cleaningProcessRef = useRef<{ cancel: boolean }>({ cancel: false })

  const startCleaning = async () => {
    // Start cleaning process
    setCleaningStatus("preparing")
    setProgress(0)
    setPumpsDone([])
    cleaningProcessRef.current = { cancel: false }

    // Short delay for preparation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    if (cleaningProcessRef.current.cancel) return
    setCleaningStatus("cleaning")

    // Clean each pump one by one
    for (let i = 0; i < pumpConfig.length; i++) {
      const pump = pumpConfig[i]
      setCurrentPump(pump.id)

      // Check if process was paused or cancelled
      if (cleaningProcessRef.current.cancel) return

      try {
        // Run pump for 10 seconds
        await cleanPumpWithPauseSupport(pump.id, 10000)

        // If process was cancelled during cleaning, stop
        if (cleaningProcessRef.current.cancel) return

        setPumpsDone((prev) => [...prev, pump.id])

        // Update progress
        setProgress(Math.round(((i + 1) / pumpConfig.length) * 100))
      } catch (error) {
        console.error(`Error cleaning pump ${pump.id}:`, error)
        if (cleaningProcessRef.current.cancel) return
      }
    }

    setCurrentPump(null)
    setCleaningStatus("complete")
  }

  // Function to clean a pump with pause support
  const cleanPumpWithPauseSupport = async (pumpId: number, duration: number) => {
    try {
      await cleanPump(pumpId, duration)
    } catch (error) {
      throw error
    }
  }

  const resetCleaning = () => {
    cleaningProcessRef.current.cancel = true
    setCleaningStatus("idle")
    setCurrentPump(null)
    setProgress(0)
    setPumpsDone([])
  }

  // Manual single pump cleaning
  const cleanSinglePump = async (pumpId: number) => {
    setManualCleaningPumps((prev) => new Set(prev).add(pumpId))

    try {
      await cleanPump(pumpId, 10000) // 10 seconds
      console.log(`Pump ${pumpId} manually cleaned`)
    } catch (error) {
      console.error(`Error manually cleaning pump ${pumpId}:`, error)
    } finally {
      setManualCleaningPumps((prev) => {
        const newSet = new Set(prev)
        newSet.delete(pumpId)
        return newSet
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Automatic Cleaning */}
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Droplets className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Automatic Pump Cleaning
          </CardTitle>
          <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
            Clean all pumps sequentially with warm water and dish soap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
            <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
              <p className="font-medium mb-1">Preparation:</p>
              <ol className="list-decimal pl-4 space-y-1 text-sm">
                <li>Prepare a container with warm water and some dish soap.</li>
                <li>Place the intake tubes of all pumps in this container.</li>
                <li>Place an empty collection container under the outlets.</li>
              </ol>
            </AlertDescription>
          </Alert>

          {cleaningStatus === "idle" && (
            <Button
              onClick={startCleaning}
              className="w-full bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black"
              size="lg"
            >
              <Droplets className="mr-2 h-5 w-5" />
              Start Automatic Cleaning
            </Button>
          )}

          {cleaningStatus === "preparing" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--cocktail-primary))]" />
              </div>
              <p className="text-center text-[hsl(var(--cocktail-text))]">Preparing cleaning...</p>
              <p className="text-center text-sm text-[hsl(var(--cocktail-text-muted))]">
                Make sure all tubes are positioned correctly.
              </p>
            </div>
          )}

          {cleaningStatus === "cleaning" && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" indicatorClassName="bg-[hsl(var(--cocktail-primary))]" />

              <div className="flex justify-between items-center">
                <span className="text-sm text-[hsl(var(--cocktail-text-muted))]">
                  {pumpsDone.length} of {pumpConfig.length} pumps cleaned
                </span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>

              {currentPump !== null && (
                <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--cocktail-primary))]" />
                    <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                      Cleaning pump {currentPump}...
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="grid grid-cols-5 gap-2">
                {pumpConfig.map((pump) => (
                  <div
                    key={pump.id}
                    className={`p-2 rounded-md text-center ${
                      pumpsDone.includes(pump.id)
                        ? "bg-[hsl(var(--cocktail-success))]/10 border border-[hsl(var(--cocktail-success))]/30"
                        : currentPump === pump.id
                          ? "bg-[hsl(var(--cocktail-primary))]/20 border border-[hsl(var(--cocktail-primary))]/50 font-bold animate-pulse"
                          : "bg-[hsl(var(--cocktail-bg))] border border-[hsl(var(--cocktail-card-border))]"
                    }`}
                  >
                    <span className={`text-sm ${currentPump === pump.id ? "text-white font-bold" : ""}`}>
                      {pump.id}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={resetCleaning}
                  className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {cleaningStatus === "complete" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="rounded-full bg-[hsl(var(--cocktail-success))]/20 p-3">
                  <Check className="h-8 w-8 text-[hsl(var(--cocktail-success))]" />
                </div>
              </div>

              <p className="text-center font-medium">Automatic cleaning completed!</p>

              <Alert className="bg-[hsl(var(--cocktail-warning))]/10 border-[hsl(var(--cocktail-warning))]/30">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--cocktail-warning))]" />
                <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                  <p className="font-medium mb-1">Important:</p>
                  <p>Now rinse the pumps with clean water to remove soap residue.</p>
                </AlertDescription>
              </Alert>

              <Button
                onClick={resetCleaning}
                className="w-full bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]"
              >
                Reset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Single Pump Cleaning */}
      <Card className="bg-black border-[hsl(var(--cocktail-card-border))]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-[hsl(var(--cocktail-primary))]" />
            Manual Pump Cleaning
          </CardTitle>
          <CardDescription className="text-[hsl(var(--cocktail-text-muted))]">
            Clean individual pumps manually (10 seconds per pump)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="bg-[hsl(var(--cocktail-card-bg))] border-[hsl(var(--cocktail-card-border))]">
            <AlertDescription className="text-[hsl(var(--cocktail-text))] text-sm">
              Click on a pump to clean it individually for 10 seconds. Make sure the intake tube of the respective pump
              is in the cleaning water.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-5 gap-3">
            {pumpConfig.map((pump) => (
              <div key={pump.id} className="flex flex-col items-center space-y-2">
                <Button
                  onClick={() => cleanSinglePump(pump.id)}
                  disabled={manualCleaningPumps.has(pump.id) || cleaningStatus === "cleaning"}
                  className={`w-full h-12 ${
                    manualCleaningPumps.has(pump.id)
                      ? "bg-[hsl(var(--cocktail-primary))]/20 border border-[hsl(var(--cocktail-primary))]/50"
                      : "bg-[hsl(var(--cocktail-card-bg))] hover:bg-[hsl(var(--cocktail-primary))] hover:text-black"
                  } text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))]`}
                >
                  {manualCleaningPumps.has(pump.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Droplets className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-xs text-[hsl(var(--cocktail-text-muted))] text-center">
                  Pump {pump.id}
                  {pump.ingredient && <div className="text-[10px] opacity-70">{pump.ingredient}</div>}
                </span>
              </div>
            ))}
          </div>

          {manualCleaningPumps.size > 0 && (
            <Alert className="bg-[hsl(var(--cocktail-primary))]/10 border-[hsl(var(--cocktail-primary))]/30">
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--cocktail-primary))]" />
              <AlertDescription className="text-[hsl(var(--cocktail-text))]">
                {manualCleaningPumps.size === 1
                  ? `Pump ${Array.from(manualCleaningPumps)[0]} is being cleaned...`
                  : `${manualCleaningPumps.size} pumps are being cleaned...`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
