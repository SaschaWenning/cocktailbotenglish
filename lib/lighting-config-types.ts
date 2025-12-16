export interface LightingConfig {
  cocktailPreparation: {
    color: string
    blinking: boolean
  }
  cocktailFinished: {
    color: string
    blinking: boolean
  }
  idleMode: {
    scheme: "static" | "rainbow" | "pulse" | "blink" | "off"
    colors: string[]
  }
}

export const defaultConfig: LightingConfig = {
  cocktailPreparation: {
    color: "#ff0000", // Red for preparation
    blinking: true,
  },
  cocktailFinished: {
    color: "#00ff00", // Green for finished
    blinking: false,
  },
  idleMode: {
    scheme: "static",
    colors: ["#0000ff"], // Blue for idle
  },
}
