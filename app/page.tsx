"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { pumpConfig as initialPumpConfig } from "@/data/pump-config"
import { makeCocktail, getPumpConfig, saveRecipe, deleteRecipe, getAllCocktails } from "@/lib/cocktail-machine"
import { AlertCircle, Edit, ChevronLeft, ChevronRight, Trash2, Check, Plus, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Cocktail } from "@/types/cocktail"
import { cocktails as defaultCocktails } from "@/data/cocktails"
import { getIngredientLevels } from "@/lib/ingredient-level-service"
import type { IngredientLevel } from "@/types/ingredient-level"
import { ingredients } from "@/data/ingredients"
import type { PumpConfig } from "@/types/pump"
import { Badge } from "@/components/ui/badge"
import CocktailCard from "@/components/cocktail-card"
import PumpCleaning from "@/components/pump-cleaning"
import PumpCalibration from "@/components/pump-calibration"
import IngredientLevels from "@/components/ingredient-levels"
import ShotSelector from "@/components/shot-selector"
import PasswordModal from "@/components/password-modal"
import RecipeEditor from "@/components/recipe-editor"
import RecipeCreator from "@/components/recipe-creator"
import DeleteConfirmation from "@/components/delete-confirmation"
import { Progress } from "@/components/ui/progress"
import ImageEditor from "@/components/image-editor"
import QuickShotSelector from "@/components/quick-shot-selector"
import { toast } from "@/components/ui/use-toast"

// Number of cocktails per page
const COCKTAILS_PER_PAGE = 9

export default function CocktailMachine() {
  const [selectedCocktail, setSelectedCocktail] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<number>(300)
  const [isMaking, setIsMaking] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("cocktails")
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showRecipeEditor, setShowRecipeEditor] = useState(false)
  const [showRecipeCreator, setShowRecipeCreator] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [cocktailToEdit, setCocktailToEdit] = useState<string | null>(null)
  const [cocktailToDelete, setCocktailToDelete] = useState<Cocktail | null>(null)
  const [cocktailsData, setCocktailsData] = useState<Cocktail[]>(defaultCocktails)
  const [ingredientLevels, setIngredientLevels] = useState<IngredientLevel[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lowIngredients, setLowIngredients] = useState<string[]>([])
  const [pumpConfig, setPumpConfig] = useState<PumpConfig[]>(initialPumpConfig)
  const [loading, setLoading] = useState(true)
  const [isCalibrationLocked, setIsCalibrationLocked] = useState(true)
  const [passwordAction, setPasswordAction] = useState<"edit" | "calibration">("edit")
  const [showImageEditor, setShowImageEditor] = useState(false)

  // Kiosk mode exit counter
  const [kioskExitClicks, setKioskExitClicks] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [virginCurrentPage, setVirginCurrentPage] = useState(1)

  // Filter cocktails by alcoholic and non-alcoholic
  const alcoholicCocktails = cocktailsData.filter((cocktail) => cocktail.alcoholic)
  const virginCocktails = cocktailsData.filter((cocktail) => !cocktail.alcoholic)

  // Calculate total number of pages
  const totalPages = Math.ceil(alcoholicCocktails.length / COCKTAILS_PER_PAGE)
  const virginTotalPages = Math.ceil(virginCocktails.length / COCKTAILS_PER_PAGE)

  // Get cocktails for current page
  const getCurrentPageCocktails = (cocktails: Cocktail[], page: number) => {
    const startIndex = (page - 1) * COCKTAILS_PER_PAGE
    const endIndex = startIndex + COCKTAILS_PER_PAGE
    return cocktails.slice(startIndex, endIndex)
  }

  // Current page cocktails
  const currentPageCocktails = getCurrentPageCocktails(alcoholicCocktails, currentPage)
  const currentPageVirginCocktails = getCurrentPageCocktails(virginCocktails, virginCurrentPage)

  // Calculate all available ingredients from cocktail recipes
  const getAvailableIngredientsFromCocktails = () => {
    const allIngredients = new Set<string>()
    cocktailsData.forEach((cocktail) => {
      cocktail.recipe.forEach((item) => {
        allIngredients.add(item.ingredientId)
      })
    })
    return Array.from(allIngredients)
  }

  // Function to reset cocktails to English
  const handleResetCocktails = async () => {
    if (!confirm("Reset all cocktails to English defaults? This will delete any custom cocktails!")) {
      return
    }

    try {
      const response = await fetch("/api/reset-cocktails", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success!",
          description: "All cocktails have been reset to English defaults.",
        })
        // Reload cocktails
        await loadCocktails()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to reset cocktails.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error resetting cocktails:", error)
      toast({
        title: "Error",
        description: "Connection problem when resetting cocktails.",
        variant: "destructive",
      })
    }
  }

  // Load fill levels, pump configuration and cocktails on first render
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([loadIngredientLevels(), loadPumpConfig(), loadCocktails()])
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const loadCocktails = async () => {
    try {
      const cocktails = await getAllCocktails()
      setCocktailsData(cocktails)
    } catch (error) {
      console.error("Error loading cocktails:", error)
    }
  }

  const loadPumpConfig = async () => {
    try {
      const config = await getPumpConfig()
      setPumpConfig(config)
    } catch (error) {
      console.error("Error loading pump configuration:", error)
    }
  }

  const loadIngredientLevels = async () => {
    try {
      const levels = await getIngredientLevels()
      setIngredientLevels(levels)

      // Check for low fill levels
      const lowLevels = levels.filter((level) => level.currentAmount < 100)
      setLowIngredients(lowLevels.map((level) => level.ingredientId))
    } catch (error) {
      console.error("Error loading fill levels:", error)
    }
  }

  const handleImageEditClick = (cocktailId: string) => {
    setCocktailToEdit(cocktailId)
    setShowImageEditor(true)
  }

  const handleDeleteClick = (cocktailId: string) => {
    const cocktail = cocktailsData.find((c) => c.id === cocktailId)
    if (cocktail) {
      setCocktailToDelete(cocktail)
      setShowDeleteConfirmation(true)
    }
  }

  const handleCalibrationClick = () => {
    setPasswordAction("calibration")
    setShowPasswordModal(true)
  }

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false)
    if (passwordAction === "edit") {
      setShowRecipeEditor(true)
    } else if (passwordAction === "calibration") {
      setIsCalibrationLocked(false)
      setActiveTab("calibration")
    }
  }

  const handleImageSave = async (updatedCocktail: Cocktail) => {
    try {
      await saveRecipe(updatedCocktail)

      // Update local list
      setCocktailsData((prev) => prev.map((c) => (c.id === updatedCocktail.id ? updatedCocktail : c)))

      // Also update fill levels for new ingredients
      await loadIngredientLevels()
    } catch (error) {
      console.error("Error saving image:", error)
    }
  }

  const handleRecipeSave = async (updatedCocktail: Cocktail) => {
    try {
      await saveRecipe(updatedCocktail)

      // Update local list
      setCocktailsData((prev) => prev.map((c) => (c.id === updatedCocktail.id ? updatedCocktail : c)))

      // Also update fill levels for new ingredients
      await loadIngredientLevels()
    } catch (error) {
      console.error("Error saving recipe:", error)
    }
  }

  const handleNewRecipeSave = async (newCocktail: Cocktail) => {
    try {
      await saveRecipe(newCocktail)

      // Add new cocktail to local list
      setCocktailsData((prev) => [...prev, newCocktail])

      // Also update fill levels for new ingredients
      await loadIngredientLevels()
    } catch (error) {
      console.error("Error saving new recipe:", error)
    }
  }

  const handleRequestDelete = (cocktailId: string) => {
    const cocktail = cocktailsData.find((c) => c.id === cocktailId)
    if (cocktail) {
      setCocktailToDelete(cocktail)
      setShowRecipeEditor(false)
      setShowDeleteConfirmation(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!cocktailToDelete) return

    try {
      await deleteRecipe(cocktailToDelete.id)

      // Update local list
      setCocktailsData((prev) => prev.filter((c) => c.id !== cocktailToDelete.id))

      // If deleted cocktail was selected, reset selection
      if (selectedCocktail === cocktailToDelete.id) {
        setSelectedCocktail(null)
      }

      setCocktailToDelete(null)
    } catch (error) {
      console.error("Error deleting cocktail:", error)
      throw error
    }
  }

  const handleMakeCocktail = async () => {
    if (!selectedCocktail) return

    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return

    setIsMaking(true)
    setProgress(0)
    setStatusMessage("Preparing cocktail...")
    setErrorMessage(null)

    try {
      // Load latest pump configuration
      const currentPumpConfig = await getPumpConfig()

      // Simulate progress
      let intervalId: NodeJS.Timeout
      intervalId = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(intervalId)
            return 100
          }
          return prev + 5
        })
      }, 300)

      // Start cocktail preparation process with selected size and current pump configuration
      await makeCocktail(cocktail, currentPumpConfig, selectedSize)

      clearInterval(intervalId)
      setProgress(100)
      setStatusMessage(`${cocktail.name} (${selectedSize}ml) ready!`)
      setShowSuccess(true)

      // Update fill levels after successful preparation
      await loadIngredientLevels()

      setTimeout(() => {
        setIsMaking(false)
        setShowSuccess(false)
        setSelectedCocktail(null)
      }, 3000)
    } catch (error) {
      let intervalId: NodeJS.Timeout
      clearInterval(intervalId)
      setProgress(0)
      setStatusMessage("Error during preparation!")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      setTimeout(() => setIsMaking(false), 3000)
    }
  }

  // Calculate current total volume of selected cocktail
  const getCurrentVolume = () => {
    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return 0
    return cocktail.recipe.reduce((total, item) => total + item.amount, 0)
  }

  // Check if enough ingredients are available for selected cocktail
  const checkIngredientsAvailable = () => {
    if (!selectedCocktail) return true

    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return true

    // Scale recipe to desired size
    const currentTotal = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
    const scaleFactor = selectedSize / currentTotal

    const scaledRecipe = cocktail.recipe.map((item) => ({
      ...item,
      amount: Math.round(item.amount * scaleFactor),
    }))

    // Check if enough of all ingredients is available
    for (const item of scaledRecipe) {
      const level = ingredientLevels.find((level) => level.ingredientId === item.ingredientId)
      if (!level) continue

      if (level.currentAmount < item.amount) {
        return false
      }
    }

    return true
  }

  const getIngredientName = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    return ingredient ? ingredient.name : id
  }

  // Tab change handler - automatically closes cocktail detail view
  const handleTabChange = (newTab: string) => {
    setSelectedCocktail(null) // Close cocktail detail view
    setActiveTab(newTab)
  }

  // Function to exit kiosk mode
  const handleExitKiosk = async () => {
    try {
      const response = await fetch("/api/exit-kiosk", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Exiting kiosk mode",
          description: "The application will close in a few seconds.",
        })
      } else {
        toast({
          title: "Error",
          description: "Could not exit kiosk mode.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error exiting kiosk mode:", error)
      toast({
        title: "Error",
        description: "Connection problem when exiting kiosk mode.",
        variant: "destructive",
      })
    }
  }

  // Handler for clicks on title
  const handleTitleClick = () => {
    const currentTime = Date.now()

    // If more than 3 seconds have passed since last click, reset counter
    if (currentTime - lastClickTime > 3000 && kioskExitClicks > 0) {
      setKioskExitClicks(1)
    } else {
      setKioskExitClicks((prev) => prev + 1)
    }

    setLastClickTime(currentTime)

    // Exit kiosk mode after 5 clicks
    if (kioskExitClicks + 1 >= 5) {
      handleExitKiosk()
      setKioskExitClicks(0)
    }
  }

  // Extended image logic for cocktail detail
  const findDetailImagePath = async (cocktail: Cocktail): Promise<string> => {
    if (!cocktail.image) {
      return `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`
    }

    // Extract filename from path
    const filename = cocktail.image.split("/").pop() || cocktail.image
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, "") // Remove file extension
    const originalExt = filename.split(".").pop()?.toLowerCase() || ""

    // All common image formats
    const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"]

    // Use original extension first, then all others
    const extensionsToTry = originalExt
      ? [originalExt, ...imageExtensions.filter((ext) => ext !== originalExt)]
      : imageExtensions

    // Different base paths for alcoholic and non-alcoholic cocktails
    const basePaths = [
      "/images/cocktails/", // Alcoholic cocktails
      "/", // Non-alcoholic cocktails (directly in public/)
      "", // Without path
      "/public/images/cocktails/", // Full path
      "/public/", // Public directory
    ]

    const strategies: string[] = []

    // Generate all combinations of paths and file extensions
    for (const basePath of basePaths) {
      for (const ext of extensionsToTry) {
        strategies.push(`${basePath}${filenameWithoutExt}.${ext}`)
      }
      // Also try original filename
      strategies.push(`${basePath}${filename}`)
    }

    // Additional special strategies
    strategies.push(
      // Original path
      cocktail.image,
      // Without leading slash
      cocktail.image.startsWith("/") ? cocktail.image.substring(1) : cocktail.image,
      // With leading slash
      cocktail.image.startsWith("/") ? cocktail.image : `/${cocktail.image}`,
      // API path as fallback
      `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/images/cocktails/${filename}`)}`,
      `/api/image?path=${encodeURIComponent(`/home/pi/cocktailbot/cocktailbot-main/public/${filename}`)}`,
    )

    // Remove duplicates
    const uniqueStrategies = [...new Set(strategies)]

    console.log(
      `Testing ${uniqueStrategies.length} detail image strategies for ${cocktail.name}:`,
      uniqueStrategies.slice(0, 10),
    )

    for (let i = 0; i < uniqueStrategies.length; i++) {
      const testPath = uniqueStrategies[i]

      try {
        const img = new Image()
        img.crossOrigin = "anonymous" // For CORS

        const loadPromise = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true)
          img.onerror = () => resolve(false)
        })

        img.src = testPath
        const success = await loadPromise

        if (success) {
          console.log(`✅ Found working detail image for ${cocktail.name}: ${testPath}`)
          return testPath
        }
      } catch (error) {
        // Ignore errors and try next strategy
      }
    }

    // Fallback to placeholder
    console.log(`❌ No working detail image found for ${cocktail.name}, using placeholder`)
    return `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`
  }

  // New component for cocktail detail view
  function CocktailDetail({ cocktail }: { cocktail: Cocktail }) {
    const [detailImageSrc, setDetailImageSrc] = useState<string>("")

    useEffect(() => {
      const loadDetailImage = async () => {
        const imagePath = await findDetailImagePath(cocktail)
        setDetailImageSrc(imagePath)
      }

      loadDetailImage()
    }, [cocktail])

    const handleDetailImageError = () => {
      const placeholder = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(cocktail.name)}`
      setDetailImageSrc(placeholder)
    }

    const availableSizes = [200, 300, 400]

    return (
      <Card className="overflow-hidden transition-all bg-black border-[hsl(var(--cocktail-card-border))] ring-2 ring-[hsl(var(--cocktail-primary))] shadow-2xl">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-1/3 aspect-square md:aspect-auto">
            <img
              src={detailImageSrc || "/placeholder.svg"}
              alt={cocktail.name}
              className="w-full h-full object-cover"
              onError={handleDetailImageError}
              crossOrigin="anonymous"
              key={`${cocktail.image}-${detailImageSrc}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="flex-1 p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-2xl text-[hsl(var(--cocktail-text))]">{cocktail.name}</h3>
              <Badge
                variant={cocktail.alcoholic ? "default" : "default"}
                className="text-sm bg-[hsl(var(--cocktail-primary))] text-black px-3 py-1"
              >
                {cocktail.alcoholic ? "Alcoholic" : "Non-Alcoholic"}
              </Badge>
            </div>
            <div className="flex flex-col md:flex-row gap-6 flex-1">
              <div className="md:w-1/2">
                <p className="text-base text-[hsl(var(--cocktail-text-muted))] mb-6 leading-relaxed">
                  {cocktail.description}
                </p>
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[hsl(var(--cocktail-text))]">Ingredients:</h4>
                  <ul className="space-y-2 text-[hsl(var(--cocktail-text))]">
                    {cocktail.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start bg-[hsl(var(--cocktail-card-bg))]/50 p-2 rounded-lg">
                        <span className="mr-2 text-[hsl(var(--cocktail-primary))]">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="md:w-1/2 flex flex-col">
                <div className="space-y-4 mb-6">
                  <h4 className="text-lg mb-3 text-[hsl(var(--cocktail-text))]">Choose cocktail size:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 px-4 rounded-lg transition-all duration-200 font-medium ${
                          selectedSize === size
                            ? "bg-[hsl(var(--cocktail-primary))] text-black shadow-lg scale-105"
                            : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
                        }`}
                      >
                        {size}ml
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-[hsl(var(--cocktail-text-muted))] bg-[hsl(var(--cocktail-card-bg))]/30 p-2 rounded">
                    Original recipe: approx. {getCurrentVolume()}ml
                  </div>
                </div>
                {!checkIngredientsAvailable() && (
                  <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30 mb-6">
                    <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                    <AlertDescription className="text-[hsl(var(--cocktail-error))] text-sm">
                      Not enough ingredients available! Please refill ingredients.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-3 mt-auto">
                  <Button
                    onClick={handleMakeCocktail}
                    disabled={!checkIngredientsAvailable()}
                    className="w-full py-3 text-lg bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Prepare cocktail ({selectedSize}ml)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCocktail(null)}
                    className="w-full py-2 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                  >
                    Back to overview
                  </Button>
                </div>
                <div className="flex justify-between mt-4 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleImageEditClick(cocktail.id)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Change image
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-2 shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(cocktail.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Pagination component
  function PaginationComponent({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) {
    return (
      <div className="flex justify-center items-center gap-3 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-10 w-10 p-0 bg-[hsl(var(--cocktail-primary))] text-black border-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50 disabled:bg-[hsl(var(--cocktail-card-bg))] disabled:text-[hsl(var(--cocktail-text))] disabled:border-[hsl(var(--cocktail-card-border))] shadow-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium text-[hsl(var(--cocktail-text))] bg-[hsl(var(--cocktail-card-bg))] px-4 py-2 rounded-lg border border-[hsl(var(--cocktail-card-border))]">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-10 w-10 p-0 bg-[hsl(var(--cocktail-primary))] text-black border-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] disabled:opacity-50 disabled:bg-[hsl(var(--cocktail-card-bg))] disabled:text-[hsl(var(--cocktail-text))] disabled:border-[hsl(var(--cocktail-card-border))] shadow-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  // Main content based on selected tab
  const renderContent = () => {
    // If a cocktail is selected, show detail view
    if (selectedCocktail) {
      const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
      if (!cocktail) return null

      if (isMaking) {
        return (
          <Card className="border-[hsl(var(--cocktail-card-border))] bg-black text-[hsl(var(--cocktail-text))] shadow-2xl">
            <div className="p-8 space-y-6">
              <h2 className="text-2xl font-semibold text-center">{statusMessage}</h2>
              <Progress value={progress} className="h-3 rounded-full" />

              {errorMessage && (
                <Alert className="bg-[hsl(var(--cocktail-error))]/10 border-[hsl(var(--cocktail-error))]/30">
                  <AlertCircle className="h-4 w-4 text-[hsl(var(--cocktail-error))]" />
                  <AlertDescription className="text-[hsl(var(--cocktail-error))]">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {showSuccess && (
                <div className="flex justify-center">
                  <div className="rounded-full bg-[hsl(var(--cocktail-success))]/20 p-4 shadow-lg">
                    <Check className="h-12 w-12 text-[hsl(var(--cocktail-success))]" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
      }

      return <CocktailDetail cocktail={cocktail} />
    }

    // Otherwise show content based on active tab
    switch (activeTab) {
      case "cocktails":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">Alcoholic Cocktails</h2>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRecipeCreator(true)}
                className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Recipe
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPageCocktails.map((cocktail) => (
                <CocktailCard key={cocktail.id} cocktail={cocktail} onClick={() => setSelectedCocktail(cocktail.id)} />
              ))}
            </div>

            {totalPages > 1 && (
              <PaginationComponent currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        )
      case "virgin":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">Non-Alcoholic Cocktails</h2>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRecipeCreator(true)}
                className="bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))] shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Recipe
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPageVirginCocktails.map((cocktail) => (
                <CocktailCard key={cocktail.id} cocktail={cocktail} onClick={() => setSelectedCocktail(cocktail.id)} />
              ))}
            </div>

            {virginTotalPages > 1 && (
              <PaginationComponent
                currentPage={virginCurrentPage}
                totalPages={virginTotalPages}
                onPageChange={setVirginCurrentPage}
              />
            )}
          </div>
        )
      case "shots":
        return (
          <ShotSelector
            pumpConfig={pumpConfig}
            ingredientLevels={ingredientLevels}
            onShotComplete={loadIngredientLevels}
            availableIngredients={getAvailableIngredientsFromCocktails()}
          />
        )
      case "quickshots":
        return (
          <QuickShotSelector
            pumpConfig={pumpConfig}
            ingredientLevels={ingredientLevels}
            onShotComplete={loadIngredientLevels}
          />
        )
      case "levels":
        return <IngredientLevels pumpConfig={pumpConfig} onLevelsUpdated={loadIngredientLevels} />
      case "cleaning":
        return <PumpCleaning pumpConfig={pumpConfig} />
      case "calibration":
        return isCalibrationLocked ? (
          <div className="text-center py-12">
            <div className="bg-[hsl(var(--cocktail-card-bg))] rounded-2xl p-8 max-w-md mx-auto shadow-2xl border border-[hsl(var(--cocktail-card-border))]">
              <Lock className="h-16 w-16 mx-auto mb-6 text-[hsl(var(--cocktail-warning))]" />
              <h2 className="text-2xl font-semibold mb-4 text-[hsl(var(--cocktail-text))]">
                Calibration is password protected
              </h2>
              <p className="text-[hsl(var(--cocktail-text-muted))] mb-6 leading-relaxed">
                Please enter the password to edit pump calibration.
              </p>
              <Button
                onClick={handleCalibrationClick}
                className="bg-[hsl(var(--cocktail-primary))] hover:bg-[hsl(var(--cocktail-primary-hover))] text-black font-semibold py-3 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Enter password
              </Button>
            </div>
          </div>
        ) : (
          <PumpCalibration pumpConfig={pumpConfig} onConfigUpdate={loadPumpConfig} />
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <header className="mb-8">
        <h1
          className="text-4xl font-bold text-center text-[hsl(var(--cocktail-text))] mb-2 cursor-pointer"
          onClick={handleTitleClick}
        >
          CocktailBot
        </h1>
        <p className="text-center text-[hsl(var(--cocktail-text-muted))]">Your personal cocktail assistant</p>

        {/* Add Reset Button */}
        <div className="text-center mt-4">
          <Button
            onClick={handleResetCocktails}
            variant="outline"
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
          >
            🔄 Reset to English
          </Button>
        </div>
      </header>

      <div className="mb-8">
        <nav className="tabs-list">
          <div className="flex overflow-x-auto space-x-3 pb-2">
            <Button
              onClick={() => handleTabChange("cocktails")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "cocktails"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Cocktails
            </Button>
            <Button
              onClick={() => handleTabChange("virgin")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "virgin"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Non-Alcoholic
            </Button>
            <Button
              onClick={() => handleTabChange("shots")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "shots"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Shots
            </Button>
            <Button
              onClick={() => handleTabChange("quickshots")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "quickshots"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Purge
            </Button>
            <Button
              onClick={() => handleTabChange("levels")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "levels"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Fill Levels
            </Button>
            <Button
              onClick={() => handleTabChange("cleaning")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "cleaning"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Cleaning
            </Button>
            <Button
              onClick={() => handleTabChange("calibration")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                activeTab === "calibration"
                  ? "bg-[hsl(var(--cocktail-primary))] text-black scale-105"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102"
              }`}
            >
              Calibration
            </Button>
          </div>
        </nav>
      </div>

      <main className="min-h-[60vh]">{renderContent()}</main>

      {/* Modals */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordSuccess}
      />

      <RecipeEditor
        isOpen={showRecipeEditor}
        onClose={() => setShowRecipeEditor(false)}
        cocktail={cocktailToEdit ? cocktailsData.find((c) => c.id === cocktailToEdit) || null : null}
        onSave={handleRecipeSave}
        onRequestDelete={handleRequestDelete}
      />

      <RecipeCreator
        isOpen={showRecipeCreator}
        onClose={() => setShowRecipeCreator(false)}
        onSave={handleNewRecipeSave}
      />

      <DeleteConfirmation
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteConfirm}
        cocktailName={cocktailToDelete?.name || ""}
      />

      <ImageEditor
        isOpen={showImageEditor}
        onClose={() => setShowImageEditor(false)}
        cocktail={cocktailToEdit ? cocktailsData.find((c) => c.id === cocktailToEdit) || null : null}
        onSave={handleImageSave}
      />
    </div>
  )
}
