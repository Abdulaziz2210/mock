"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useRef, useState, useEffect } from "react"

interface SpotlightProps {
  className?: string
  children: React.ReactNode
}

export function Spotlight({ children, className = "" }: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mousePositionRef.current = { x, y }

      if (containerRef.current) {
        const spotlight = containerRef.current.querySelector(".spotlight") as HTMLElement
        if (spotlight) {
          spotlight.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(120, 119, 198, 0.1), transparent 40%)`
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [isMounted])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800",
        className,
      )}
    >
      <div className="spotlight absolute inset-0 pointer-events-none transition-all duration-300 z-0" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
