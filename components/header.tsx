"use client"

import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ModeToggle } from "@/components/mode-toggle"
import { BookOpen, Headphones, PenTool, MessageSquare } from "lucide-react"

export function Header() {
  const { t } = useLanguage()

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            {t("app_name")}
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/reading" className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="h-4 w-4" />
              {t("reading")}
            </Link>
            <Link href="/listening" className="flex items-center gap-2 text-sm font-medium">
              <Headphones className="h-4 w-4" />
              {t("listening")}
            </Link>
            <Link href="/writing" className="flex items-center gap-2 text-sm font-medium">
              <PenTool className="h-4 w-4" />
              {t("writing")}
            </Link>
            <Link href="/speaking" className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              {t("speaking")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
