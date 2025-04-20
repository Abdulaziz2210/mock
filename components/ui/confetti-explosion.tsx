"use client"

import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"
import { useWindowSize } from "react-use"

export function ConfettiExplosion({ duration = 3000 }: { duration?: number }) {
  const { width, height } = useWindowSize()
  const [isExploding, setIsExploding] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExploding(false)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  if (!isExploding) return null

  return <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />
}
