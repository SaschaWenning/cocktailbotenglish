export const runtime = "edge"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import cocktailsData from "@/data/cocktails.json"

export async function GET() {
  try {
    console.log("[v0] API: Loading cocktails from static data...")
    console.log("[v0] API: Loaded cocktails:", cocktailsData?.length || 0)
    return NextResponse.json(cocktailsData)
  } catch (error) {
    console.error("[v0] API: Error getting cocktails:", error)
    return NextResponse.json([], { status: 500 })
  }
}
