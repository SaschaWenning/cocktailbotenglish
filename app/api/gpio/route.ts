import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

// Path to Python script
const PYTHON_SCRIPT = path.join(process.cwd(), "pump_control.py")

export async function GET(request: Request) {
  try {
    // Simple test to check if API route works
    return NextResponse.json({ success: true, message: "GPIO API is active" })
  } catch (error) {
    console.error("Error in GPIO API route (GET):", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    // Check if Python script exists
    if (!fs.existsSync(PYTHON_SCRIPT)) {
      console.error(`Python script not found: ${PYTHON_SCRIPT}`)
      return NextResponse.json({ success: false, error: `Python script not found: ${PYTHON_SCRIPT}` }, { status: 500 })
    }

    // Parse request body
    let data
    try {
      data = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const { action, pin, duration } = data

    // Validate parameters
    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 })
    }

    let result
    let cmdOutput = ""

    try {
      switch (action) {
        case "activate":
          if (!pin || !duration) {
            return NextResponse.json({ success: false, error: "Pin and duration are required" }, { status: 400 })
          }
          console.log(`Activating pin ${pin} for ${duration}ms...`)
          const activateCmd = `python3 ${PYTHON_SCRIPT} activate ${pin} ${duration}`
          console.log(`Command: ${activateCmd}`)
          const activateResult = await execAsync(activateCmd)
          cmdOutput = activateResult.stdout.trim()
          console.log(`Activation output: ${cmdOutput}`)

          // Return success for pump control
          return NextResponse.json({ success: true, message: `Pin ${pin} activated for ${duration}ms` })

        case "test":
          // Simple test that doesn't require Python script
          console.log("Running test action...")
          return NextResponse.json({ success: true, message: "Test successful" })

        default:
          return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 })
      }
    } catch (error) {
      console.error(`Error executing action ${action}:`, error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          command: action,
          output: cmdOutput,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("General error in GPIO API route:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
