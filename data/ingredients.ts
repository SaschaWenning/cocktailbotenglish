import type { Ingredient } from "@/types/pump"

export const ingredients: Ingredient[] = [
  // Alcoholic Beverages - Spirits (currently in use)
  { id: "vodka", name: "Vodka", alcoholic: true },
  { id: "dark-rum", name: "Dark Rum", alcoholic: true },
  { id: "gin", name: "Gin", alcoholic: true },
  { id: "tequila", name: "Tequila", alcoholic: true },

  // Alcoholic Beverages - Liqueurs (currently in use)
  { id: "malibu", name: "Malibu", alcoholic: true },
  { id: "peach-liqueur", name: "Peach Liqueur", alcoholic: true },
  { id: "blue-curacao", name: "Blue Curaçao", alcoholic: true },
  { id: "triple-sec", name: "Triple Sec", alcoholic: true },

  // Non-Alcoholic Beverages - Fruit Juices (currently in use)
  { id: "orange-juice", name: "Orange Juice", alcoholic: false },
  { id: "pineapple-juice", name: "Pineapple Juice", alcoholic: false },
  { id: "cranberry-juice", name: "Cranberry Juice", alcoholic: false },
  { id: "passion-fruit-juice", name: "Passion Fruit Juice", alcoholic: false },

  // Non-Alcoholic Beverages - Citrus Fruits (currently in use)
  { id: "lime-juice", name: "Lime Juice", alcoholic: false },
  { id: "lemon-juice", name: "Lemon Juice", alcoholic: false },

  // Non-Alcoholic Beverages - Carbonated Drinks
  { id: "cola", name: "Cola", alcoholic: false },
  { id: "soda-water", name: "Soda Water", alcoholic: false },

  // Non-Alcoholic Beverages - Dairy Products
  { id: "creme-of-coconut", name: "Cream of Coconut", alcoholic: false },

  // Syrups (currently in use)
  { id: "vanilla-syrup", name: "Vanilla Syrup", alcoholic: false },
  { id: "almond-syrup", name: "Almond Syrup", alcoholic: false },
  { id: "grenadine", name: "Grenadine", alcoholic: false },
  { id: "coconut-syrup", name: "Coconut Syrup", alcoholic: false },
]
