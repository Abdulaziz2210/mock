import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    // Always log results to console as a reliable fallback
    console.log("========== TEST RESULTS ==========")
    console.log(message)
    console.log("==================================")

    // In preview/development mode, just return success without trying Telegram
    if (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development") {
      return NextResponse.json({
        success: true,
        message: "Results logged to console (preview/development mode)",
      })
    }

    // Store results locally in a simple way (this will be lost on server restart)
    // In a real app, you would use a database
    if (typeof global.testResults === "undefined") {
      global.testResults = []
    }
    global.testResults.push({
      timestamp: new Date().toISOString(),
      data: message,
    })

    // Try to send to Telegram, but don't fail if it doesn't work
    try {
      // Telegram configuration
      const token = "7541550330:AAHYAD-TP6fGLLI2oahVCWw0xzNrT8RbTPE"

      // First, verify if the bot token is valid by checking getMe endpoint
      const verifyResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`)
      const verifyData = await verifyResponse.json()

      if (!verifyData.ok) {
        throw new Error(`Invalid bot token: ${verifyData.description}`)
      }

      // Bot token is valid, now try to send the message
      // Try different chat ID formats
      const chatIds = [
        "@dreamzone_ielts_results", // Channel username
        "-1002320115900", // Numeric channel ID
        "1002320115900", // Without the minus
      ]

      const formattedMessage = encodeURIComponent(message)

      let sentSuccessfully = false
      let lastError = null

      // Try each chat ID until one works
      for (const chatId of chatIds) {
        try {
          const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${formattedMessage}&parse_mode=Markdown`
          const response = await fetch(url)
          const data = await response.json()

          if (data.ok) {
            sentSuccessfully = true
            break
          } else {
            lastError = data.description
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error)
        }
      }

      if (!sentSuccessfully) {
        throw new Error(`Failed to send message: ${lastError}`)
      }

      return NextResponse.json({
        success: true,
        message: "Results sent to Telegram successfully",
      })
    } catch (telegramError) {
      console.error("Error sending to Telegram:", telegramError)

      // Return success anyway since we logged the results
      return NextResponse.json({
        success: true,
        warning: "Results logged to console due to Telegram API error",
        error: telegramError instanceof Error ? telegramError.message : String(telegramError),
        note: "Test results have been saved locally and are available in the console",
      })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 500 },
    )
  }
}