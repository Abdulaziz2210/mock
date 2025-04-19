"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "ru" | "uz"

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({})

  useEffect(() => {
    // Load translations
    const loadTranslations = async () => {
      const translations = {
        en: await import("@/translations/en.json").then((m) => m.default),
        ru: await import("@/translations/ru.json").then((m) => m.default),
        uz: await import("@/translations/uz.json").then((m) => m.default),
      }
      setTranslations(translations)
    }

    loadTranslations()
  }, [])

  const t = (key: string): string => {
    if (!translations[language]) return key
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
