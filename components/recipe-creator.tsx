"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Cocktail } from "@/types/cocktail"
import { ingredients } from "@/data/ingredients"
import { saveRecipe } from "@/lib/cocktail-machine"
import { Loader2, ImageIcon, Trash2, Plus, Minus, FolderOpen, ArrowLeft, ArrowUp, Lock, X, Check } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RecipeEditorProps {
  isOpen: boolean
  onClose: () => void
  cocktail: Cocktail | null
  onSave: (updatedCocktail: Cocktail) => void
  onRequestDelete: (cocktailId: string) => void
}

// Available images in the project
const AVAILABLE_IMAGES = [
  { path: "/images/cocktails/bahama_mama.jpg", name: "Bahama Mama" },
  { path: "/images/cocktails/big_john.jpg", name: "Big John" },
  { path: "/images/cocktails/long_island_iced_tea.jpg", name: "Long Island Iced Tea" },
  { path: "/images/cocktails/mai_tai.jpg", name: "Mai Tai" },
  { path: "/images/cocktails/malibu_ananas.jpg", name: "Malibu Pineapple" },
  { path: "/images/cocktails/malibu_colada.jpg", name: "Malibu Colada" },
  { path: "/images/cocktails/malibu_sunrise.jpg", name: "Malibu Sunrise" },
  { path: "/images/cocktails/malibu_sunset.jpg", name: "Malibu Sunset" },
  { path: "/images/cocktails/mojito.jpg", name: "Mojito" },
  { path: "/images/cocktails/passion_colada.jpg", name: "Passion Colada" },
  { path: "/images/cocktails/peaches_cream.jpg", name: "Peaches & Cream" },
  { path: "/images/cocktails/planters_punch.jpg", name: "Planter's Punch" },
  { path: "/images/cocktails/sex_on_the_beach.jpg", name: "Sex on the Beach" },
  { path: "/images/cocktails/solero.jpg", name: "Solero" },
  { path: "/images/cocktails/swimming_pool.jpg", name: "Swimming Pool" },
  { path: "/images/cocktails/tequila_sunrise.jpg", name: "Tequila Sunrise" },
  { path: "/images/cocktails/touch_down.jpg", name: "Touch Down" },
  { path: "/images/cocktails/zombie.jpg", name: "Zombie" },
]

export default function RecipeEditor({ isOpen, onClose, cocktail, onSave, onRequestDelete }: RecipeEditorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [alcoholic, setAlcoholic] = useState(true)
  const [recipe, setRecipe] = useState<{ ingredientId: string; amount: number }[]>([])
  const [saving, setSaving] = useState(false)

  // View states - same as RecipeCreator
  const [currentView, setCurrentView] = useState<"form" | "keyboard" | "imageBrowser">("form")
  const [activeInput, setActiveInput] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")

  // Keyboard state
  const [keyboardMode, setKeyboardMode] = useState(activeInput || "name")
  const [keyboardValue, setKeyboardValue] = useState(inputValue || "")
  const [isShiftActive, setIsShiftActive] = useState(false)
  const [isCapsLockActive, setIsCapsLockActive] = useState(false)

  // Load cocktail data when opening
  useEffect(() => {
    if (cocktail && isOpen) {
      setName(cocktail.name)
      setDescription(cocktail.description)
      setAlcoholic(cocktail.alcoholic)
      setRecipe([...cocktail.recipe])

      // Normalize image path
      let imagePath = cocktail.image || ""
      if (imagePath.startsWith("/placeholder")) {
        setImageUrl("")
      } else {
        // Make sure path starts with /
        if (imagePath && !imagePath.startsWith("/") && !imagePath.startsWith("http")) {
          imagePath = `/${imagePath}`
        }
        // Remove URL parameters
        imagePath = imagePath.split("?")[0]
        setImageUrl(imagePath)
      }

      // Reset view
      setCurrentView("form")
      setActiveInput(null)
      setInputValue("")

      console.log(`Editor loaded for ${cocktail.name}:`, {
        name: cocktail.name,
        description: cocktail.description,
        image: imagePath,
        alcoholic: cocktail.alcoholic,
        recipe: cocktail.recipe,
      })
    }
  }, [cocktail, isOpen])

  if (!cocktail) return null

  // Keyboard handlers - same as RecipeCreator
  const handleInputFocus = (inputType: string, currentValue = "") => {
    setActiveInput(inputType)
    setInputValue(currentValue)
    setCurrentView("keyboard")
    setKeyboardMode(inputType)
    setKeyboardValue(currentValue)
  }

  const handleKeyboardInput = (value: string) => {
    setKeyboardValue(value)
  }

  const handleKeyPress = (key: string) => {
    let newKey = key
    if (!keyboardMode.startsWith("amount-")) {
      if (isShiftActive || isCapsLockActive) {
        newKey = key.toUpperCase()
      }
      if (isShiftActive) {
        setIsShiftActive(false)
      }
    }

    setKeyboardValue((prev) => prev + newKey)
  }

  const handleBackspace = () => {
    setKeyboardValue((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    setKeyboardValue("")
  }

  const handleShift = () => {
    setIsShiftActive((prev) => !prev)
  }

  const handleCapsLock = () => {
    setIsCapsLockActive((prev) => !prev)
  }

  const handleKeyboardConfirm = () => {
    if (!activeInput) return

    switch (activeInput) {
      case "name":
        setName(keyboardValue)
        break
      case "description":
        setDescription(keyboardValue)
        break
      case "imageUrl":
        setImageUrl(keyboardValue)
        break
      default:
        if (activeInput.startsWith("amount-")) {
          const index = Number.parseInt(activeInput.replace("amount-", ""))
          const amount = Number.parseFloat(keyboardValue)
          if (!isNaN(amount) && amount >= 0) {
            handleAmountChange(index, amount)
          }
        }
        break
    }

    setCurrentView("form")
    setActiveInput(null)
    setInputValue("")
  }

  const handleKeyboardCancel = () => {
    setCurrentView("form")
    setActiveInput(null)
    setInputValue("")
  }

  // Recipe handlers
  const handleAmountChange = (index: number, amount: number) => {
    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], amount }
    setRecipe(updatedRecipe)
  }

  const handleIngredientChange = (index: number, ingredientId: string) => {
    const updatedRecipe = [...recipe]
    updatedRecipe[index] = { ...updatedRecipe[index], ingredientId }
    setRecipe(updatedRecipe)
  }

  const addIngredient = () => {
    const availableIngredients = ingredients.filter(
      (ingredient) => !recipe.some((item) => item.ingredientId === ingredient.id),
    )

    if (availableIngredients.length > 0) {
      setRecipe([...recipe, { ingredientId: availableIngredients[0].id, amount: 30 }])
    }
  }

  const removeIngredient = (index: number) => {
    if (recipe.length > 1) {
      const updatedRecipe = recipe.filter((_, i) => i !== index)
      setRecipe(updatedRecipe)
    }
  }

  // Image browser handlers
  const handleSelectImage = (path: string) => {
    setImageUrl(path)
    setCurrentView("form")
  }

  // Save handler
  const handleSave = async () => {
    if (!cocktail || !name.trim() || recipe.length === 0) return

    setSaving(true)
    try {
      const updatedCocktail: Cocktail = {
        ...cocktail,
        name: name.trim(),
        description: description.trim(),
        image: imageUrl || "/placeholder.svg?height=200&width=400",
        alcoholic,
        recipe: recipe,
        ingredients: recipe.map((item) => {
          const ingredient = ingredients.find((i) => i.id === item.ingredientId)
          return `${item.amount}ml ${ingredient?.name || item.ingredientId}`
        }),
      }

      await saveRecipe(updatedCocktail)
      onSave(updatedCocktail)
      onClose()
    } catch (error) {
      console.error("Error saving recipe:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRequest = () => {
    if (!cocktail) return
    onRequestDelete(cocktail.id)
  }

  const getIngredientName = (id: string) => {
    const ingredient = ingredients.find((i) => i.id === id)
    return ingredient ? ingredient.name : id
  }

  // Form View - same as RecipeCreator
  const renderFormView = () => (
    <div className="space-y-6 my-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Cocktail Name
        </Label>
        <Input
          id="name"
          value={name}
          onClick={() => handleInputFocus("name", name)}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
          placeholder="e.g. My Cocktail"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-white">
          Description
        </Label>
        <Input
          id="description"
          value={description}
          onClick={() => handleInputFocus("description", description)}
          readOnly
          className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer"
          placeholder="Describe your cocktail..."
        />
      </div>

      {/* Alcoholic */}
      <div className="space-y-2">
        <Label className="text-white">Type</Label>
        <Select
          value={alcoholic ? "alcoholic" : "virgin"}
          onValueChange={(value) => setAlcoholic(value === "alcoholic")}
        >
          <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))]">
            <SelectItem value="alcoholic" className="text-black hover:bg-gray-100 cursor-pointer">
              With Alcohol
            </SelectItem>
            <SelectItem value="virgin" className="text-black hover:bg-gray-100 cursor-pointer">
              Non-Alcoholic
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-white">
          <ImageIcon className="h-4 w-4" />
          Image (optional)
        </Label>
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onClick={() => handleInputFocus("imageUrl", imageUrl)}
            readOnly
            className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer flex-1"
            placeholder="Image URL or select from gallery"
          />
          <Button
            type="button"
            onClick={() => setCurrentView("imageBrowser")}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
          >
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Recipe */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-white">Recipe</Label>
          <Button
            type="button"
            size="sm"
            onClick={addIngredient}
            className="bg-[hsl(var(--cocktail-primary))] text-black hover:bg-[hsl(var(--cocktail-primary-hover))]"
            disabled={recipe.length >= ingredients.length}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Ingredient
          </Button>
        </div>

        <div className="space-y-2">
          {recipe.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 items-center p-3 bg-[hsl(var(--cocktail-card-bg))] rounded border border-[hsl(var(--cocktail-card-border))]"
            >
              <div className="col-span-6">
                <Select value={item.ingredientId} onValueChange={(value) => handleIngredientChange(index, value)}>
                  <SelectTrigger className="bg-white border-[hsl(var(--cocktail-card-border))] text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[hsl(var(--cocktail-card-border))] max-h-48 overflow-y-auto">
                    {ingredients.map((ingredient) => (
                      <SelectItem
                        key={ingredient.id}
                        value={ingredient.id}
                        className="text-black hover:bg-gray-100 cursor-pointer"
                      >
                        {ingredient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <Input
                  value={item.amount}
                  onClick={() => handleInputFocus(`amount-${index}`, item.amount.toString())}
                  readOnly
                  className="bg-white border-[hsl(var(--cocktail-card-border))] text-black cursor-pointer text-center"
                />
              </div>
              <div className="col-span-2 text-sm text-white">ml</div>
              <div className="col-span-1">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeIngredient(index)}
                  disabled={recipe.length <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Keyboard View - same as RecipeCreator
  const renderKeyboardView = () => {
    const isNumericKeyboard = keyboardMode.startsWith("amount-")

    const keys = isNumericKeyboard
      ? [
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
          [".", "0"],
        ]
      : [
          ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
          ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
          ["z", "x", "c", "v", "b", "n", "m", "-", "_"],
          ["123", "@", "!", "?", " ", "#", "%", "&", "*", "+"],
        ]

    const t = (key: string) => {
      switch (key) {
        case "enter_name":
          return "Edit Name"
        case "enter_description":
          return "Edit Description"
        case "enter_image_path":
          return "Edit Image URL"
        case "enter_amount_ml":
          return "Edit Amount (ml)"
        case "input_placeholder":
          return "Enter value"
        case "shift":
          return "Shift"
        case "caps":
          return "Caps"
        case "cancel":
          return "Cancel"
        default:
          return key
      }
    }

    return (
      // KEYBOARD VIEW
      <div className="flex gap-4 my-4">
        {/* Keyboard auf der linken Seite */}
        <div className="flex-1">
          <div className="text-center mb-3">
            <h3 className="text-lg font-semibold text-white mb-2">
              {keyboardMode === "name" && t("enter_name")}
              {keyboardMode === "description" && t("enter_description")}
              {keyboardMode === "imageUrl" && t("enter_image_path")}
              {keyboardMode.startsWith("amount-") && t("enter_amount_ml")}
            </h3>
            <div className="bg-white text-black text-base p-2 rounded mb-3 min-h-[35px] break-all">
              {keyboardValue || <span className="text-gray-400">{t("input_placeholder")}</span>}
            </div>
          </div>

          <div className="grid gap-1">
            {keys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((key) => (
                  <Button
                    key={key}
                    type="button"
                    onClick={() => handleKeyPress(key)}
                    className="flex-1 h-9 text-sm bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ))}

            {/* Shift and Caps Lock row (only for alpha keyboard) */}
            {!isNumericKeyboard && (
              <div className="flex gap-1 justify-center">
                <Button
                  type="button"
                  onClick={handleShift}
                  className={`flex-1 h-9 text-white text-sm ${
                    isShiftActive ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {t("shift")}
                </Button>
                <Button
                  type="button"
                  onClick={handleCapsLock}
                  className={`flex-1 h-9 text-white text-sm ${
                    isCapsLockActive ? "bg-orange-600 hover:bg-orange-700" : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  {t("caps")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons auf der rechten Seite */}
        <div className="flex flex-col gap-2 w-24">
          <Button
            type="button"
            onClick={handleBackspace}
            className="h-12 bg-red-700 hover:bg-red-600 text-white flex flex-col items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs">Back</span>
          </Button>
          <Button
            type="button"
            onClick={handleClear}
            className="h-12 bg-yellow-700 hover:bg-yellow-600 text-white flex flex-col items-center justify-center"
          >
            <X className="h-4 w-4" />
            <span className="text-xs">Clear</span>
          </Button>
          <Button
            type="button"
            onClick={handleKeyboardCancel}
            className="h-12 bg-gray-700 hover:bg-gray-600 text-white flex flex-col items-center justify-center"
          >
            <span className="text-xs">{t("cancel")}</span>
          </Button>
          <Button
            type="button"
            onClick={handleKeyboardConfirm}
            className="h-12 bg-green-700 hover:bg-green-600 text-white flex flex-col items-center justify-center"
          >
            <Check className="h-4 w-4" />
            <span className="text-xs">OK</span>
          </Button>
        </div>
      </div>
    )
  }

  // Image Browser View
  const renderImageBrowserView = () => (
    <div className="space-y-4 my-4">
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          onClick={() => setCurrentView("form")}
          className="bg-gray-700 hover:bg-gray-600 text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-white">Select Image</h3>
      </div>

      <ScrollArea className="h-[50vh]">
        <div className="grid grid-cols-2 gap-3">
          {AVAILABLE_IMAGES.map((image) => (
            <div
              key={image.path}
              onClick={() => handleSelectImage(image.path)}
              className="cursor-pointer group border border-[hsl(var(--cocktail-card-border))] rounded-lg overflow-hidden hover:border-[hsl(var(--cocktail-primary))] transition-colors"
            >
              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                <img
                  src={image.path || "/placeholder.svg"}
                  alt={image.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    target.nextElementSibling?.classList.remove("hidden")
                  }}
                />
                <div className="hidden text-white text-sm text-center p-2">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  {image.name}
                </div>
              </div>
              <div className="p-2 bg-[hsl(var(--cocktail-card-bg))]">
                <p className="text-white text-sm truncate">{image.name}</p>
                <p className="text-gray-400 text-xs truncate">{image.path}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black border-[hsl(var(--cocktail-card-border))] text-white sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Recipe: {cocktail.name}</DialogTitle>
        </DialogHeader>

        {currentView === "form" && renderFormView()}
        {currentView === "keyboard" && renderKeyboardView()}
        {currentView === "imageBrowser" && renderImageBrowserView()}

        {currentView === "form" && (
          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteRequest}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Recipe
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-[hsl(var(--cocktail-card-bg))] text-white border-[hsl(var(--cocktail-card-border))] hover:bg-[hsl(var(--cocktail-card-border))]"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#00ff00] text-black hover:bg-[#00cc00]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
