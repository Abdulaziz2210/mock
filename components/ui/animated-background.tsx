"use client"
import { motion } from "framer-motion"

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 opacity-80" />

      {/* Animated circles */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute h-[300px] w-[300px] rounded-full bg-gradient-to-r from-purple-300 to-pink-200 dark:from-purple-900 dark:to-pink-800 opacity-20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          style={{ top: "10%", left: "20%" }}
        />
        <motion.div
          className="absolute h-[250px] w-[250px] rounded-full bg-gradient-to-r from-blue-300 to-teal-200 dark:from-blue-900 dark:to-teal-800 opacity-20 blur-3xl"
          animate={{
            x: [0, -70, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          style={{ top: "40%", right: "15%" }}
        />
        <motion.div
          className="absolute h-[200px] w-[200px] rounded-full bg-gradient-to-r from-amber-300 to-orange-200 dark:from-amber-900 dark:to-orange-800 opacity-20 blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          style={{ bottom: "15%", left: "30%" }}
        />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
    </div>
  )
}

// Add this to your globals.css
// .bg-grid-pattern {
//   background-size: 40px 40px;
//   background-image:
//     linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px),
//     linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
// }
