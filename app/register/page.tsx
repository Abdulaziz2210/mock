"use client"
import { useState } from "react"
import type React from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Function to generate a random password
const generatePassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export default function Register() {
  const { t } = useLanguage()
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [copied, setCopied] = useState(false)

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setCopied(false)

    if (!fullName.trim()) {
      setError(t("name_required"))
      return
    }

    try {
      // Generate a random password
      const password = generatePassword()
      setGeneratedPassword(password)

      // Get existing users or initialize empty array
      const existingUsersJSON = localStorage.getItem("registeredUsers") || "[]"
      const existingUsers = JSON.parse(existingUsersJSON)

      // Add new user
      const newUser = {
        fullName: fullName.trim(),
        password,
        registeredAt: new Date().toISOString(),
        used: false,
      }

      existingUsers.push(newUser)
      localStorage.setItem("registeredUsers", JSON.stringify(existingUsers))

      // Show success message with password
      setSuccess(true)

      // Log to console for testing
      console.log("Registered user:", newUser)

      // Also try to send to Telegram if in production
      if (process.env.NODE_ENV === "production") {
        try {
          const message = `
📝 *New Registration*

👤 *Student*: ${fullName.trim()}
🔑 *Password*: ${password}
⏰ *Registered*: ${new Date().toLocaleString()}
          `

          fetch("/api/send-telegram", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
          }).catch((err) => console.error("Failed to send registration to Telegram:", err))
        } catch (err) {
          console.error("Error sending registration to Telegram:", err)
        }
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError(t("registration_error"))
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(generatedPassword)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      })
      .catch((err) => {
        console.error("Failed to copy:", err)
      })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f9] dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md bg-white dark:bg-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("register")}</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t("register_description")}</p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  {t("registration_success")}
                </AlertDescription>
              </Alert>

              <div className="mt-4 space-y-2">
                <p className="font-medium">{t("your_password")}:</p>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md flex-1 font-mono">
                    {generatedPassword}
                  </div>
                  <Button size="icon" variant="outline" onClick={copyToClipboard} title={t("copy_password")}>
                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">{t("password_warning")}</p>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => router.push("/")}>
                  {t("go_to_login")}
                </Button>
                <Button
                  onClick={() => {
                    setSuccess(false)
                    setFullName("")
                    setGeneratedPassword("")
                  }}
                >
                  {t("register_another")}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  {t("full_name")}
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("enter_full_name")}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                {t("register")}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("already_registered")}{" "}
                  <Link href="/" className="text-primary hover:underline">
                    {t("login_instead")}
                  </Link>
                </p>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Dream Zone
        </CardFooter>
      </Card>
    </div>
  )
}
