import { type NextRequest, NextResponse } from "next/server"
// import { readFile, access } from "fs/promises"
// import { constants } from "fs"
// import path from "path"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imagePath = searchParams.get("path")

    if (!imagePath) {
      return NextResponse.json({ error: "Bildpfad ist erforderlich" }, { status: 400 })
    }

    console.log("[v0] Image API: In v0 preview, images should be served from /public directory")

    // In production on Raspberry Pi, this would use fs to read files
    return NextResponse.json(
      {
        error: "Image loading from filesystem not available in v0 preview",
        suggestion: "Use images from /public directory instead",
      },
      { status: 501 },
    )
  } catch (error) {
    console.error("[v0] Image API Error:", error)
    return NextResponse.json({ error: "Fehler beim Laden des Bildes" }, { status: 500 })
  }
}
