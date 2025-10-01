import { NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

// Path to Python script
const PYTHON_SCRIPT = path.join(process.cwd(), "scripts/gpio_controller.py")

function findPythonCommand(): string {
  const possibleCommands = ["python3", "python", "/usr/bin/python3", "/usr/bin/python"]
  // In production, try to find the first available Python
  // In v0 preview, default to python3
  return possibleCommands[0]
}

function executePythonScript(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonCmd = findPythonCommand()
    console.log(`[v0] Executing: ${pythonCmd} ${PYTHON_SCRIPT} ${args.join(" ")}`)

    const process = spawn(pythonCmd, [PYTHON_SCRIPT, ...args])
    let stdout = ""
    let stderr = ""

    process.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    process.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    process.on("close", (code) => {
      if (code !== 0) {
        console.error(`[v0] Python script failed with code ${code}`)
        console.error(`[v0] stderr: ${stderr}`)
        reject(new Error(`Python script failed: ${stderr || "Unknown error"}`))
        return
      }

      try {
        const result = JSON.parse(stdout.trim())
        resolve(result)
      } catch (error) {
        console.error(`[v0] Failed to parse Python output: ${stdout}`)
        reject(new Error(`Invalid JSON output from Python script: ${stdout}`))
      }
    })

    process.on("error", (error) => {
      console.error(`[v0] Failed to start Python process:`, error)
      reject(error)
    })
  })
}

export async function GET(request: Request) {
  try {
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
    let data
    try {
      data = await request.json()
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const { action, pin, duration } = data

    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 })
    }

    try {
      let result

      switch (action) {
        case "setup":
          console.log("Executing setup action...")
          result = await executePythonScript(["setup"])
          break

        case "activate":
          if (!pin || !duration) {
            return NextResponse.json({ success: false, error: "Pin and duration are required" }, { status: 400 })
          }
          console.log(`Activating pin ${pin} for ${duration}ms...`)
          result = await executePythonScript(["activate", String(pin), String(duration)])
          break

        case "cleanup":
          console.log("Executing cleanup action...")
          result = await executePythonScript(["cleanup"])
          break

        case "test":
          console.log("Executing test action...")
          return NextResponse.json({ success: true, message: "Test successful" })

        default:
          return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 })
      }

      return NextResponse.json(result)
    } catch (error) {
      console.error(`Error executing action ${action}:`, error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          command: action,
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
