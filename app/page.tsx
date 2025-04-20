"use client"
import { useState } from "react"
import type React from "react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function Home() {
  const { t } = useLanguage()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      // Get stored users from localStorage
      const storedUsersJSON = localStorage.getItem("registeredUsers") || "[]"
      const storedUsers = JSON.parse(storedUsersJSON)

      // Find user with matching username and password
      const userMatch = storedUsers.find(
        (user: any) => user.fullName === username && user.password === password && !user.used,
      )

      if (userMatch) {
        // Mark password as used
        const updatedUsers = storedUsers.map((user: any) => {
          if (user.fullName === username && user.password === password) {
            return { ...user, used: true }
          }
          return user
        })
        localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))

        // Store login state in session storage
        sessionStorage.setItem("isLoggedIn", "true")
        sessionStorage.setItem("currentUser", username)
        router.push("/test")
      } else {
        // Check if password was already used
        const usedPassword = storedUsers.find(
          (user: any) => user.fullName === username && user.password === password && user.used,
        )

        if (usedPassword) {
          setError(t("password_already_used"))
        } else {
          setError(t("login_credentials_incorrect"))
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      setError(t("login_error"))
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f9] dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">{t("app_name")}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t("platform_description")}</p>
        </div>

        <Card className="w-full bg-white dark:bg-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t("login")}</CardTitle>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t("login_description")}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  {t("full_name")}
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("enter_full_name")}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  {t("password")}
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("enter_password")}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                {t("login")}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("no_account")}{" "}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    {t("register_now")}
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Dream Zone
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
