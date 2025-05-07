import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  try {
    // Define the path to the single audio file
    const audioFileName = "listening-test.mp3"
    const audioFilePath = path.join(process.cwd(), "public", "audio", audioFileName)

    // Check if the file exists
    let fileExists = false
    try {
      await fs.promises.access(audioFilePath, fs.constants.F_OK)
      fileExists = true
    } catch (error) {
      fileExists = false
      console.error(`Audio file not found at ${audioFilePath}:`, error)
    }

    if (!fileExists) {
      // Check if the audio directory exists
      const audioDir = path.join(process.cwd(), "public", "audio")
      let dirExists = false

      try {
        await fs.promises.access(audioDir, fs.constants.F_OK)
        dirExists = true
      } catch (error) {
        dirExists = false
        console.error(`Audio directory not found at ${audioDir}:`, error)
      }

      // Create helpful error message
      let errorMessage = "Audio file not found"
      if (!dirExists) {
        errorMessage = "Audio directory not found. Please create the directory: public/audio/"

        // Try to create the directory
        try {
          await fs.promises.mkdir(audioDir, { recursive: true })
          errorMessage += " (Directory has been created for you. Please add the audio file.)"
        } catch (mkdirError) {
          console.error("Failed to create audio directory:", mkdirError)
        }
      } else {
        errorMessage = `Audio file not found: ${audioFileName}. Please add it to the public/audio directory.`
      }

      return NextResponse.json(
        {
          error: errorMessage,
          message: "Please ensure the listening-test.mp3 file is properly placed in the public/audio directory",
          development: process.env.NODE_ENV === "development",
          path: audioFilePath,
          publicPath: `/audio/${audioFileName}`,
        },
        { status: 404 },
      )
    }

    // Get file stats for additional info
    const stats = await fs.promises.stat(audioFilePath)

    return NextResponse.json({
      success: true,
      file: audioFileName,
      path: `/audio/${audioFileName}`,
      size: stats.size,
      message: `Audio file ${audioFileName} is available (${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
    })
  } catch (error) {
    console.error("Error serving audio:", error)
    return NextResponse.json(
      {
        error: "Failed to serve audio file",
        details: error instanceof Error ? error.message : String(error),
        development: process.env.NODE_ENV === "development",
      },
      { status: 500 },
    )
  }
}
