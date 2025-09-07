"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import PumpCleaning from "@/components/pump-cleaning"
import PumpCalibration from "@/components/pump-calibration"
import IngredientLevels from "@/components/ingredient-levels"
import QuickShotSelector from "@/components/quick-shot-selector"
import PasswordModal from "@/components/password-modal"
import { IngredientManager } from "@/components/ingredient-manager"
import type { PumpConfig } from "@/types/pump"
import type { IngredientLevel } from "@/types/ingredient-level"

interface ServiceMenuProps {
  pumpConfig: PumpConfig[]
  ingredientLevels: IngredientLevel[]
  onLevelsUpdated: () => void
  onConfigUpdate: () => void
  onShotComplete: () => void
  availableIngredients: string[]
}

export default function ServiceMenu({
  pumpConfig,
  ingredientLevels,
  onLevelsUpdated,
  onConfigUpdate,
  onShotComplete,
  availableIngredients,
}: ServiceMenuProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [activeServiceTab, setActiveServiceTab] = useState("fill-levels")

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false)
    setIsUnlocked(true)
  }

  const handleUnlockClick = () => {
    setShowPasswordModal(true)
  }

  if (!isUnlocked) {
    return (
      <>
        <div className="text-center py-12">
          <div className="bg-[hsl(var(--cocktail-card-bg))] rounded-2xl p-8 max-w-md mx-auto shadow-2xl border border-[hsl(var(--cocktail-card-border))]">
            <Lock className="h-16 w-16 mx-auto mb-6 text-[hsl(var(--cocktail-warning))]" />
            <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--cocktail-text))]">
              Service Menu is Password Protected
            </h2>
            <p className="text-[hsl(var(--cocktail-text-muted))] mb-6 leading-relaxed">
              Please enter the password to access the service menu.
            </p>
            <Button
              onClick={handleUnlockClick}
              className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Enter Password
            </Button>
          </div>
        </div>

        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
        />
      </>
    )
  }

  const renderServiceContent = () => {
    switch (activeServiceTab) {
      case "bleed":
        return (
          <QuickShotSelector
            pumpConfig={pumpConfig}
            ingredientLevels={ingredientLevels}
            onShotComplete={onShotComplete}
          />
        )
      case "fill-levels":
        return <IngredientLevels pumpConfig={pumpConfig} onLevelsUpdated={onLevelsUpdated} />
      case "cleaning":
        return <PumpCleaning pumpConfig={pumpConfig} />
      case "calibration":
        return <PumpCalibration pumpConfig={pumpConfig} onConfigUpdate={onConfigUpdate} />
      case "ingredients":
        return <IngredientManager onClose={() => setActiveServiceTab("fill-levels")} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">Service Menu</h2>
        <Button
          variant="outline"
          onClick={() => setIsUnlocked(false)}
          className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
        >
          <Lock className="h-4 w-4 mr-2" />
          Lock
        </Button>
      </div>

      <div className="mb-6">
        <nav className="service-tabs-list">
          <div className="flex overflow-x-auto space-x-3 pb-2">
            <Button
              onClick={() => setActiveServiceTab("bleed")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "bleed"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Bleed
            </Button>
            <Button
              onClick={() => setActiveServiceTab("fill-levels")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "fill-levels"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Fill Levels
            </Button>
            <Button
              onClick={() => setActiveServiceTab("cleaning")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "cleaning"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Cleaning
            </Button>
            <Button
              onClick={() => setActiveServiceTab("calibration")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "calibration"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Calibration
            </Button>
            <Button
              onClick={() => setActiveServiceTab("ingredients")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeServiceTab === "ingredients"
                  ? "bg-[#00ff00] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Ingredients
            </Button>
          </div>
        </nav>
      </div>

      <div className="min-h-[60vh]">{renderServiceContent()}</div>
    </div>
  )
}
