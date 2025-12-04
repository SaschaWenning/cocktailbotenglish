"use client"

import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { useEffect } from "react"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Füge beforeunload Event-Listener hinzu für Persistierung beim App-Beenden
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      console.log("[v0] App closing - saving fill levels and container sizes...")

      try {
        // Get current fill levels
        const response = await fetch("/api/ingredient-levels", {
          method: "GET",
          cache: "no-store",
        })

        if (response.ok) {
          const levels = await response.json()

          // Save to localStorage as backup
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "ingredient-levels-backup",
              JSON.stringify({
                levels,
                timestamp: new Date().toISOString(),
              }),
            )
            console.log("[v0] Fill levels successfully saved on app close")
          }

          // Explicit save via API
          await fetch("/api/ingredient-levels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(levels),
          })
        }
      } catch (error) {
        console.error("[v0] Error saving fill levels on app close:", error)
      }

      // Show confirmation (optional)
      event.preventDefault()
      event.returnValue = ""
    }

    // Add event listener
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Cleanup on unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[hsl(var(--cocktail-bg))]">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
