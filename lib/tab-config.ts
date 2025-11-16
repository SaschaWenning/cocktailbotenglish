export interface TabConfig {
  id: string
  name: string
  icon?: string
  location: "main" | "service"
  passwordProtected?: boolean
  alwaysVisible?: boolean // For tabs that must always be visible (e.g., Service menu)
}

export interface AppConfig {
  tabs: TabConfig[]
}

// Default configuration
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
      name: "Non-Alcoholic",
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
      name: "New Recipe",
      location: "service",
      passwordProtected: true,
    },
    {
      id: "levels",
      name: "Fill Levels",
      location: "service",
      passwordProtected: true,
    },
    {
      id: "ingredients",
      name: "Ingredients",
      location: "service",
      passwordProtected: true,
    },
    {
      id: "calibration",
      name: "Calibration",
      location: "service",
      passwordProtected: true,
    },
    {
      id: "cleaning",
      name: "Cleaning",
      location: "service",
      passwordProtected: true,
    },
    {
      id: "venting",
      name: "Venting",
      location: "service",
      passwordProtected: true,
    },
    {
      id: "hidden-cocktails",
      name: "Hidden Cocktails",
      location: "service",
      passwordProtected: true,
    },
    {
      id: "beleuchtung",
      name: "Lighting",
      location: "service",
      passwordProtected: true,
    },
    {
      id: "service",
      name: "Service Menu",
      location: "main",
      passwordProtected: false,
      alwaysVisible: true,
    },
  ],
}
