export interface Ingredient {
  id: string
  name: string
  alcoholic: boolean
  category: "spirit" | "liqueur" | "juice" | "syrup" | "mixer" | "garnish"
}

export const ingredients: Ingredient[] = [
  // Spirits
  { id: "vodka", name: "Vodka", alcoholic: true, category: "spirit" },
  { id: "dark-rum", name: "Dark Rum", alcoholic: true, category: "spirit" },
  { id: "white-rum", name: "White Rum", alcoholic: true, category: "spirit" },
  { id: "gin", name: "Gin", alcoholic: true, category: "spirit" },
  { id: "tequila", name: "Tequila", alcoholic: true, category: "spirit" },
  { id: "whiskey", name: "Whiskey", alcoholic: true, category: "spirit" },
  { id: "bourbon", name: "Bourbon", alcoholic: true, category: "spirit" },
  { id: "scotch", name: "Scotch", alcoholic: true, category: "spirit" },
  { id: "brandy", name: "Brandy", alcoholic: true, category: "spirit" },
  { id: "cognac", name: "Cognac", alcoholic: true, category: "spirit" },

  // Liqueurs
  { id: "malibu", name: "Malibu", alcoholic: true, category: "liqueur" },
  { id: "triple-sec", name: "Triple Sec", alcoholic: true, category: "liqueur" },
  { id: "blue-curacao", name: "Blue Curacao", alcoholic: true, category: "liqueur" },
  { id: "peach-liqueur", name: "Peach Liqueur", alcoholic: true, category: "liqueur" },
  { id: "amaretto", name: "Amaretto", alcoholic: true, category: "liqueur" },
  { id: "kahlua", name: "Kahlua", alcoholic: true, category: "liqueur" },
  { id: "baileys", name: "Baileys", alcoholic: true, category: "liqueur" },
  { id: "sambuca", name: "Sambuca", alcoholic: true, category: "liqueur" },
  { id: "jagermeister", name: "Jägermeister", alcoholic: true, category: "liqueur" },
  { id: "midori", name: "Midori", alcoholic: true, category: "liqueur" },
  { id: "chambord", name: "Chambord", alcoholic: true, category: "liqueur" },
  { id: "frangelico", name: "Frangelico", alcoholic: true, category: "liqueur" },
  { id: "cointreau", name: "Cointreau", alcoholic: true, category: "liqueur" },
  { id: "grand-marnier", name: "Grand Marnier", alcoholic: true, category: "liqueur" },
  { id: "apricot-brandy", name: "Apricot Brandy", alcoholic: true, category: "liqueur" },

  // Juices
  { id: "orange-juice", name: "Orange Juice", alcoholic: false, category: "juice" },
  { id: "pineapple-juice", name: "Pineapple Juice", alcoholic: false, category: "juice" },
  { id: "cranberry-juice", name: "Cranberry Juice", alcoholic: false, category: "juice" },
  { id: "lime-juice", name: "Lime Juice", alcoholic: false, category: "juice" },
  { id: "lemon-juice", name: "Lemon Juice", alcoholic: false, category: "juice" },
  { id: "grapefruit-juice", name: "Grapefruit Juice", alcoholic: false, category: "juice" },
  { id: "passion-fruit-juice", name: "Passion Fruit Juice", alcoholic: false, category: "juice" },
  { id: "mango-juice", name: "Mango Juice", alcoholic: false, category: "juice" },
  { id: "apple-juice", name: "Apple Juice", alcoholic: false, category: "juice" },
  { id: "grape-juice", name: "Grape Juice", alcoholic: false, category: "juice" },
  { id: "tomato-juice", name: "Tomato Juice", alcoholic: false, category: "juice" },

  // Syrups
  { id: "grenadine", name: "Grenadine", alcoholic: false, category: "syrup" },
  { id: "sugar-syrup", name: "Sugar Syrup", alcoholic: false, category: "syrup" },
  { id: "vanilla-syrup", name: "Vanilla Syrup", alcoholic: false, category: "syrup" },
  { id: "almond-syrup", name: "Almond Syrup", alcoholic: false, category: "syrup" },
  { id: "coconut-syrup", name: "Coconut Syrup", alcoholic: false, category: "syrup" },
  { id: "strawberry-syrup", name: "Strawberry Syrup", alcoholic: false, category: "syrup" },
  { id: "raspberry-syrup", name: "Raspberry Syrup", alcoholic: false, category: "syrup" },

  // Mixers
  { id: "soda-water", name: "Soda Water", alcoholic: false, category: "mixer" },
  { id: "tonic-water", name: "Tonic Water", alcoholic: false, category: "mixer" },
  { id: "ginger-beer", name: "Ginger Beer", alcoholic: false, category: "mixer" },
  { id: "cola", name: "Cola", alcoholic: false, category: "mixer" },
  { id: "sprite", name: "Sprite", alcoholic: false, category: "mixer" },
  { id: "ginger-ale", name: "Ginger Ale", alcoholic: false, category: "mixer" },
  { id: "coconut-milk", name: "Coconut Milk", alcoholic: false, category: "mixer" },
  { id: "coconut-cream", name: "Coconut Cream", alcoholic: false, category: "mixer" },

  // Wine & Vermouth
  { id: "red-wine", name: "Red Wine", alcoholic: true, category: "spirit" },
  { id: "white-wine", name: "White Wine", alcoholic: true, category: "spirit" },
  { id: "champagne", name: "Champagne", alcoholic: true, category: "spirit" },
  { id: "prosecco", name: "Prosecco", alcoholic: true, category: "spirit" },
  { id: "dry-vermouth", name: "Dry Vermouth", alcoholic: true, category: "liqueur" },
  { id: "sweet-vermouth", name: "Sweet Vermouth", alcoholic: true, category: "liqueur" },

  // Bitters & Others
  { id: "angostura-bitters", name: "Angostura Bitters", alcoholic: true, category: "liqueur" },
  { id: "campari", name: "Campari", alcoholic: true, category: "liqueur" },
  { id: "aperol", name: "Aperol", alcoholic: true, category: "liqueur" },
]
