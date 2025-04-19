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

export default function Home() {
  const { t } = useLanguage()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (username.trim() === "Abduraxmatov Abdulaziz") {
      // Store login state in session storage
      sessionStorage.setItem("isLoggedIn", "true")
      router.push("/test")
    } else {
      setError(t("username_incorrect"))
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("app_name")}</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t("login_description")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                {t("username")}
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("enter_username")}
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
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Dream Zone
        </CardFooter>
      </Card>
    </div>
  )
}
