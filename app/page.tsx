"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { pumpConfig as initialPumpConfig } from "@/data/pump-config"
import { makeCocktail, getPumpConfig, saveRecipe, getAllCocktails } from "@/lib/cocktail-machine"
import { AlertCircle, Edit, ChevronLeft, ChevronRight, Trash2, Check, Plus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Cocktail } from "@/types/cocktail"
import { getIngredientLevels } from "@/lib/ingredient-level-service"
import type { IngredientLevel } from "@/types/ingredient-level"
import type { PumpConfig } from "@/types/pump"
import { Badge } from "@/components/ui/badge"
import CocktailCard from "@/components/cocktail-card"
import PumpCleaning from "@/components/pump-cleaning"
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
import ServiceMenu from "@/components/service-menu"
import { getAllIngredients } from "@/lib/ingredients"

// Number of cocktails per page
const COCKTAILS_PER_PAGE = 9

export default function Home() {
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
  const [showRecipeCreatorPasswordModal, setShowRecipeCreatorPasswordModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [cocktailToEdit, setCocktailToEdit] = useState<string | null>(null)
  const [cocktailToDelete, setCocktailToDelete] = useState<Cocktail | null>(null)
  const [cocktailsData, setCocktailsData] = useState<Cocktail[]>([])
  const [ingredientLevels, setIngredientLevels] = useState<IngredientLevel[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lowIngredients, setLowIngredients] = useState<string[]>([])
  const [pumpConfig, setPumpConfig] = useState<PumpConfig[]>(initialPumpConfig)
  const [loading, setLoading] = useState(true)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [allIngredientsData, setAllIngredientsData] = useState<any[]>([]) // State for all ingredients (standard + user-defined) added
  const [manualIngredients, setManualIngredients] = useState<
    Array<{ ingredientId: string; amount: number; instructions?: string }>
  >([]) // State for manual ingredients added
  const [showImageEditorPasswordModal, setShowImageEditorPasswordModal] = useState(false) // New state for Image Editor Password Modal

  // Kiosk Mode Exit Counter
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

  // Get cocktails for the current page
  const getCurrentPageCocktails = (cocktails: Cocktail[], page: number) => {
    const startIndex = (page - 1) * COCKTAILS_PER_PAGE
    const endIndex = startIndex + COCKTAILS_PER_PAGE
    return cocktails.slice(startIndex, endIndex)
  }

  // Current page of cocktails
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

  // Load fill levels, pump configuration, and cocktails on first render
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([loadIngredientLevels(), loadPumpConfig(), loadCocktails(), loadAllIngredients()])
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const loadCocktails = async () => {
    console.log("[v0] Loading cocktails...")
    const cocktails = await getAllCocktails()
    console.log("[v0] Loaded cocktails from getAllCocktails:", cocktails.length)

    // Load hidden cocktails from API instead of localStorage
    try {
      const response = await fetch("/api/hidden-cocktails")
      const data = await response.json()
      const hiddenCocktails: string[] = data.hiddenCocktails || []
      console.log("[v0] Hidden cocktails from API:", hiddenCocktails)

      const visibleCocktails = cocktails.filter((cocktail) => !hiddenCocktails.includes(cocktail.id))
      console.log("[v0] Visible cocktails after filtering:", visibleCocktails.length)
      console.log("[v0] Filtered out cocktails:", cocktails.length - visibleCocktails.length)

      setCocktailsData(visibleCocktails)
      console.log("[v0] Setting cocktails data with", visibleCocktails.length, "cocktails")
    } catch (error) {
      console.error("[v0] Error loading hidden cocktails:", error)
      // Fallback to showing all cocktails if API fails
      setCocktailsData(cocktails)
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

  const loadAllIngredients = async () => {
    try {
      const ingredients = await getAllIngredients()
      setAllIngredientsData(ingredients)
    } catch (error) {
      console.error("Error loading ingredients:", error)
    }
  }

  const handleImageEditClick = (cocktailId: string) => {
    setCocktailToEdit(cocktailId)
    setShowImageEditorPasswordModal(true)
  }

  const handleDeleteClick = (cocktailId: string) => {
    const cocktail = cocktailsData.find((c) => c.id === cocktailId)
    if (cocktail) {
      setCocktailToDelete(cocktail)
      setShowDeleteConfirmation(true)
    }
  }

  const handleCalibrationClick = () => {
    setActiveTab("service")
    setShowPasswordModal(true)
  }

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false)
    if (activeTab === "cocktails" || activeTab === "virgin") {
      setShowRecipeEditor(true)
    } else if (activeTab === "service") {
      setActiveTab("service")
    }
  }

  const handleRecipeCreatorPasswordSuccess = () => {
    setShowRecipeCreatorPasswordModal(false)
    setShowRecipeCreator(true)
  }

  const handleImageEditorPasswordSuccess = () => {
    setShowImageEditorPasswordModal(false)
    setShowImageEditor(true)
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
      console.log("[v0] Deleting/hiding cocktail:", cocktailToDelete.id)

      // Get current hidden cocktails from API
      const response = await fetch("/api/hidden-cocktails")
      const data = await response.json()
      const hiddenCocktails: string[] = data.hiddenCocktails || []
      console.log("[v0] Current hidden cocktails before adding:", hiddenCocktails)

      // Add cocktail ID to hidden list if not already there
      if (!hiddenCocktails.includes(cocktailToDelete.id)) {
        hiddenCocktails.push(cocktailToDelete.id)

        // Save updated list to API
        await fetch("/api/hidden-cocktails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hiddenCocktails }),
        })
        console.log("[v0] Updated hidden cocktails via API:", hiddenCocktails)
      } else {
        console.log("[v0] Cocktail already in hidden list")
      }

      setCocktailsData((prev) => prev.filter((c) => c.id !== cocktailToDelete.id))
      console.log("[v0] Removed cocktail from local state")

      // If the hidden cocktail was selected, reset selection
      if (selectedCocktail === cocktailToDelete.id) {
        setSelectedCocktail(null)
      }

      setCocktailToDelete(null)
    } catch (error) {
      console.error("Error hiding cocktail:", error)
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
    setManualIngredients([]) // Reset manual ingredients

    try {
      // Load the latest pump configuration
      const currentPumpConfig = await getPumpConfig()

      const totalRecipeVolume = cocktail.recipe.reduce((total, item) => total + item.amount, 0)
      const scaleFactor = selectedSize / totalRecipeVolume

      const manualRecipeItems = cocktail.recipe
        .filter((item) => item.manual === true || item.type === "manual")
        .map((item) => ({
          ingredientId: item.ingredientId,
          amount: Math.round(item.amount * scaleFactor),
          instructions: item.instructions || item.instruction,
        }))

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

      if (manualRecipeItems.length > 0) {
        setManualIngredients(manualRecipeItems)
        setStatusMessage(`${cocktail.name} (${selectedSize}ml) automatically prepared! Please add manual ingredients.`)
      } else {
        setStatusMessage(`${cocktail.name} (${selectedSize}ml) ready!`)
      }

      setShowSuccess(true)

      // Update fill levels after successful preparation
      await loadIngredientLevels()

      setTimeout(
        () => {
          setIsMaking(false)
          setShowSuccess(false)
          setSelectedCocktail(null)
          setManualIngredients([]) // Reset manual ingredients after timeout
        },
        manualRecipeItems.length > 0 ? 8000 : 3000,
      ) // Longer display time for manual ingredients
    } catch (error) {
      let intervalId: NodeJS.Timeout
      clearInterval(intervalId)
      setProgress(0)
      setStatusMessage("Error preparing cocktail!")
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      setManualIngredients([]) // Reset on error
      setTimeout(() => setIsMaking(false), 3000)
    }
  }

  // Calculate current total volume of selected cocktail
  const getCurrentVolume = () => {
    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return 0
    // Sum all amounts, regardless of type (automatic/manual)
    return cocktail.recipe.reduce((total, item) => total + item.amount, 0)
  }

  // Check if enough ingredients are available for selected cocktail
  const checkIngredientsAvailable = () => {
    if (!selectedCocktail) return true

    const cocktail = cocktailsData.find((c) => c.id === selectedCocktail)
    if (!cocktail) return true

    if (!pumpConfig || pumpConfig.length === 0) {
      console.warn("Pump configuration is not loaded or empty.")
      return false // Or true, depending on desired behavior if no pumps are configured
    }

    const automaticRecipe = cocktail.recipe.filter((item) => {
      // An ingredient is automatic if:
      // 1. manual is explicitly false OR
      // 2. manual is undefined/not set AND type is not "manual"
      return item.manual === false || (item.manual !== true && item.type !== "manual")
    })

    // If no automatic ingredients are available, the cocktail is available (only manual ingredients)
    if (automaticRecipe.length === 0) return true

    // Calculate total volume of entire recipe (automatic + manual) for scaling
    const totalRecipeVolume = cocktail.recipe.reduce((total, item) => total + item.amount, 0)

    // If total volume is 0 but there are ingredients, something is wrong
    if (totalRecipeVolume === 0 && cocktail.recipe.length > 0) return false

    const scaleFactor = selectedSize / totalRecipeVolume

    // Check only automatic ingredients for availability
    for (const item of automaticRecipe) {
      const level = ingredientLevels.find((level) => level.ingredientId === item.ingredientId)
      // CORRECTION: Search for 'ingredient' instead of 'ingredientId' in pump configuration
      const pump = pumpConfig.find((pc) => pc.ingredient === item.ingredientId)

      // If no fill level data OR no pump configuration for an automatic ingredient is found, it is not available
      if (!level || !pump) {
        console.warn(
          `Automatic ingredient ${item.ingredientId} is not available (no fill level data or pump configuration).`,
        )
        return false
      }

      const scaledAmount = Math.round(item.amount * scaleFactor) // Scale amount for this ingredient
      if (level.currentAmount < scaledAmount) {
        console.warn(
          `Not enough ${item.ingredientId} available. Needed: ${scaledAmount}ml, Available: ${level.currentAmount}ml`,
        )
        return false
      }
    }

    return true
  }

  const getIngredientName = (id: string) => {
    const ingredient = allIngredientsData.find((i) => i.id === id)
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
          title: "Exiting Kiosk Mode",
          description: "The application will close in a few seconds.",
        })
      } else {
        toast({
          title: "Error",
          description: "Kiosk mode could not be exited.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error exiting kiosk mode:", error)
      toast({
        title: "Error",
        description: "Connection problem exiting kiosk mode.",
        variant: "destructive",
      })
    }
  }

  // Handler for clicks on the title
  const handleTitleClick = () => {
    const currentTime = Date.now()

    // If more than 3 seconds have passed since the last click, reset the counter
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

  // Enhanced image logic for cocktail detail
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
      // Also try the original filename
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
        // Ignore error and try next strategy
      }
    }

    // Fallback on placeholder
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
                    {cocktail.recipe.map((item, index) => {
                      const ingredient = allIngredientsData.find((i) => i.id === item.ingredientId)
                      let ingredientName = ingredient ? ingredient.name : item.ingredientId

                      if (!ingredient && item.ingredientId.startsWith("custom-")) {
                        ingredientName = item.ingredientId.replace(/^custom-\d+-/, "")
                      }

                      return (
                        <li
                          key={index}
                          className="flex items-start bg-[hsl(var(--cocktail-card-bg))]/50 p-2 rounded-lg"
                        >
                          <span className="mr-2 text-[hsl(var(--cocktail-primary))]">•</span>
                          <span>
                            {item.amount}ml {ingredientName}
                            {(item.manual === true || item.type === "manual") && (
                              <span className="text-[hsl(var(--cocktail-text-muted))] ml-2">(manual)</span>
                            )}
                            {(item.manual === true || item.type === "manual") && item.instruction && (
                              <span className="block text-sm text-[hsl(var(--cocktail-text-muted))] italic mt-1">
                                Instructions: {item.instruction}
                              </span>
                            )}
                          </span>
                        </li>
                      )
                    })}
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
                            ? "bg-[#00ff00] text-black shadow-lg scale-105"
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
                      Not enough ingredients available or pump not connected! Please refill the ingredients.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-3 mt-auto">
                  <Button
                    onClick={handleMakeCocktail}
                    disabled={!checkIngredientsAvailable()}
                    className="w-full py-3 text-lg bg-[#00ff00] hover:bg-[#00ff00] text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Prepare Cocktail ({selectedSize}ml)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCocktail(null)}
                    className="w-full py-2 bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
                  >
                    Back to Overview
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
                    Change Image
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
          className="h-10 w-10 p-0 bg-[#00ff00] text-black border-[#00ff00] hover:bg-[#00ff00] disabled:opacity-50 disabled:bg-[hsl(var(--cocktail-card-bg))] disabled:text-[hsl(var(--cocktail-text))] disabled:border-[hsl(var(--cocktail-card-border))] shadow-lg"
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
          className="h-10 w-10 p-0 bg-[#00ff00] text-black border-[#00ff00] hover:bg-[#00ff00] disabled:opacity-50 disabled:bg-[hsl(var(--cocktail-card-bg))] disabled:text-[hsl(var(--cocktail-text))] disabled:border-[hsl(var(--cocktail-card-border))] shadow-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  // Main content based on selected tab
  const renderContent = () => {
    // If a cocktail is selected, show the detail view
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

              {showSuccess && manualIngredients.length > 0 && (
                <div className="bg-[hsl(var(--cocktail-card-bg))]/50 p-6 rounded-lg border border-[hsl(var(--cocktail-card-border))]">
                  <h3 className="text-lg font-semibold mb-4 text-[hsl(var(--cocktail-primary))]">
                    Please add the following ingredients manually:
                  </h3>
                  <ul className="space-y-3">
                    {manualIngredients.map((item, index) => {
                      const ingredient = allIngredientsData.find((i) => i.id === item.ingredientId)
                      let ingredientName = ingredient ? ingredient.name : item.ingredientId

                      if (!ingredient && item.ingredientId.startsWith("custom-")) {
                        ingredientName = item.ingredientId.replace(/^custom-\d+-/, "")
                      }

                      return (
                        <li key={index} className="flex items-start bg-[hsl(var(--cocktail-card-bg))]/30 p-3 rounded">
                          <span className="mr-3 text-[hsl(var(--cocktail-primary))] font-bold">•</span>
                          <div>
                            <span className="font-medium text-[hsl(var(--cocktail-text))]">
                              {item.amount}ml {ingredientName}
                            </span>
                            {item.instructions && (
                              <p className="text-sm text-[hsl(var(--cocktail-text-muted))] mt-1 italic">
                                {item.instructions}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
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

    // Otherwise, show content based on active tab
    switch (activeTab) {
      case "cocktails":
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-[hsl(var(--cocktail-text))]">Alcoholic Cocktails</h2>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowRecipeCreatorPasswordModal(true)}
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
                onClick={() => setShowRecipeCreatorPasswordModal(true)}
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
      case "service":
        return (
          <ServiceMenu
            pumpConfig={pumpConfig}
            ingredientLevels={ingredientLevels}
            onLevelsUpdated={loadIngredientLevels}
            onConfigUpdate={loadPumpConfig}
            onShotComplete={loadIngredientLevels}
            availableIngredients={getAvailableIngredientsFromCocktails()}
          />
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
      </header>

      <div className="mb-8">
        <nav className="tabs-list">
          <div className="flex overflow-x-auto space-x-3 pb-2">
            <Button
              onClick={() => handleTabChange("cocktails")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none ${
                activeTab === "cocktails"
                  ? "bg-[#00ff00] text-black scale-105 focus:bg-[#00ff00]"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102 focus:bg-[#00ff00] focus:text-black"
              }`}
            >
              Cocktails
            </Button>
            <Button
              onClick={() => handleTabChange("virgin")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none ${
                activeTab === "virgin"
                  ? "bg-[#00ff00] text-black scale-105 focus:bg-[#00ff00]"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102 focus:bg-[#00ff00] focus:text-black"
              }`}
            >
              Non-Alcoholic
            </Button>
            <Button
              onClick={() => handleTabChange("shots")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none ${
                activeTab === "shots"
                  ? "bg-[#00ff00] text-black scale-105 focus:bg-[#00ff00]"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102 focus:bg-[#00ff00] focus:text-black"
              }`}
            >
              Shots
            </Button>
            <Button
              onClick={() => handleTabChange("service")}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none ${
                activeTab === "service"
                  ? "bg-[#00ff00] text-black scale-105 focus:bg-[#00ff00]"
                  : "bg-[hsl(var(--cocktail-card-bg))] text-[hsl(var(--cocktail-text))] hover:bg-[hsl(var(--cocktail-card-border))] hover:scale-102 focus:bg-[#00ff00] focus:text-black"
              }`}
            >
              Service Menu
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

      <PasswordModal
        isOpen={showImageEditorPasswordModal}
        onClose={() => setShowImageEditorPasswordModal(false)}
        onSuccess={handleImageEditorPasswordSuccess}
      />

      <PasswordModal
        isOpen={showRecipeCreatorPasswordModal}
        onClose={() => setShowRecipeCreatorPasswordModal(false)}
        onSuccess={handleRecipeCreatorPasswordSuccess}
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
