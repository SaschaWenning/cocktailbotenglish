import { NextResponse } from "next/server"
// import { readdir } from "fs/promises"
// import { join } from "path"

export async function GET() {
  try {
    console.log("[v0] List Images API: In v0 preview, filesystem access not available")

    // In production on Raspberry Pi, this would scan directories
    return NextResponse.json({
      success: true,
      directories: {},
      totalImages: 0,
      message: "Filesystem access not available in v0 preview",
    })
  } catch (error) {
    console.error("[v0] Fehler beim Scannen der Bildverzeichnisse:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Fehler beim Scannen der Verzeichnisse",
      },
      { status: 500 },
    )
  }
}
