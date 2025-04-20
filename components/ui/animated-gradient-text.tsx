"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function AnimatedGradientText({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.span
      className={cn(
        "inline-block bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400",
        className,
      )}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 10,
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
      style={{ backgroundSize: "200% 200%" }}
    >
      {children}
    </motion.span>
  )
}
