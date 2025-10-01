export interface TabConfig {
  id: string
  name: string
  icon?: string
  location: "main" | "service"
  passwordProtected?: boolean
  alwaysVisible?: boolean // Translated comment: For tabs that must always be visible (e.g. Service Menu)
}

export interface AppConfig {
  tabs: TabConfig[]
}

export const defaultTabConfig: AppConfig = {
  tabs: [
    {
      id: "cocktails",
      name: "Cocktails",
      location: "main",
      passwordProtected: false,
    },
    {
      id: "virgin",
      name: "Non-Alcoholic", // Translated from "Alkoholfrei"
      location: "main",
      passwordProtected: false,
    },
    {
      id: "shots",
      name: "Shots",
      location: "main",
      passwordProtected: false,
    },
    {
      id: "recipe-creator",
      name: "New Recipe", // Translated from "Neues Rezept"
      location: "service",
      passwordProtected: true,
    },
    {
      id: "levels",
      name: "Fill Levels", // Translated from "Füllstände"
      location: "service",
      passwordProtected: true,
    },
    {
      id: "ingredients",
      name: "Ingredients", // Translated from "Zutaten"
      location: "service",
      passwordProtected: true,
    },
    {
      id: "calibration",
      name: "Calibration", // Translated from "Kalibrierung"
      location: "service",
      passwordProtected: true,
    },
    {
      id: "cleaning",
      name: "Cleaning", // Translated from "Reinigung"
      location: "service",
      passwordProtected: true,
    },
    {
      id: "venting",
      name: "Venting", // Translated from "Entlüften"
      location: "service",
      passwordProtected: true,
    },
    {
      id: "hidden-cocktails",
      name: "Hidden Cocktails", // Translated from "Ausgeblendete Cocktails"
      location: "service",
      passwordProtected: true,
    },
    {
      id: "beleuchtung",
      name: "Lighting", // Translated from "Beleuchtung"
      location: "service",
      passwordProtected: true,
    },
    {
      id: "service",
      name: "Service Menu", // Translated from "Servicemenü"
      location: "main",
      passwordProtected: false,
      alwaysVisible: true,
    },
  ],
}
